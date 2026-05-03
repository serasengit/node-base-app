import { APICode } from '@api-messages/api-messages';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as dotenv from 'dotenv';
import { knex, Knex } from 'knex';
import { after, afterEach, describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import app from '../../../../server';

dotenv.config({ path: 'environments/.env.test' });

chai.use(chaiHttp);

const db: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    timezone: 'UTC'
  }
});

const API_ENDPOINT = `/${process.env.SERVER_API}/meteo-stations`;
const TEST_PREFIX = 'TEST_METEO_';

type MeteoStationRecord = {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  city_id?: number | null;
};

function uniqueStationName(suffix: string): string {
  return `${TEST_PREFIX}${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function getSeededStation(): Promise<MeteoStationRecord> {
  const station = await db<MeteoStationRecord>('meteo_stations').select('*').orderBy('id', 'asc').first();

  if (!station) {
    throw new Error('Expected seeded meteo stations in test database.');
  }

  return station;
}

async function insertTestStation(overrides: Partial<MeteoStationRecord> = {}): Promise<MeteoStationRecord> {
  const firstCity = await db('cities').select('id').orderBy('id', 'asc').first();

  if (!firstCity) {
    throw new Error('Expected seeded cities in test database.');
  }

  const [station] = await db<MeteoStationRecord>('meteo_stations')
    .insert({
      name: overrides.name ?? uniqueStationName('INSERTED'),
      longitude: overrides.longitude ?? -3.70379,
      latitude: overrides.latitude ?? 40.41678,
      city_id: overrides.city_id ?? firstCity.id
    })
    .returning('*');

  return station;
}

async function cleanupTestStations(): Promise<void> {
  await db('meteo_stations').where('name', 'like', `${TEST_PREFIX}%`).del();
}

function expectStationCoordinates(
  body: { longitude: string | number; latitude: string | number },
  expected: { longitude: number; latitude: number }
): void {
  expect(Number(body.longitude)).to.equal(expected.longitude);
  expect(Number(body.latitude)).to.equal(expected.latitude);
}

describe('Meteo Stations API', function () {
  afterEach(async () => {
    await cleanupTestStations();
  });

  after(async () => {
    await db.destroy();
  });

  describe('GET /meteo-stations', () => {
    it('should list meteo stations', async () => {
      const response = await chai.request(app).get(API_ENDPOINT);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('total').that.is.a('number');
      expect(response.body).to.have.property('records').that.is.an('array');
      expect(response.body.records[0]).to.include.all.keys('id', 'name', 'longitude', 'latitude');
    });

    it('should filter meteo stations by textSearch', async () => {
      const station = await insertTestStation({ name: uniqueStationName('SEARCHABLE') });

      const response = await chai.request(app).get(API_ENDPOINT).query({ textSearch: station.name });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body.records).to.be.an('array');
      expect(response.body.records.some((record) => record.id === station.id)).to.equal(true);
    });

    it('should return 422 when orderBy is invalid', async () => {
      const response = await chai.request(app).get(API_ENDPOINT).query({ orderBy: 'invalidColumn' });

      expect(response).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('errors').that.is.an('array');
    });
  });

  describe('GET /meteo-stations/:id', () => {
    it('should fetch one meteo station by id', async () => {
      const station = await getSeededStation();

      const response = await chai.request(app).get(`${API_ENDPOINT}/${station.id}`);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: station.id,
        name: station.name
      });
    });

    it('should include relations when requested', async () => {
      const station = await getSeededStation();

      const response = await chai.request(app).get(`${API_ENDPOINT}/${station.id}`).query({
        include: 'city'
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('city');
    });

    it('should return 422 when id is invalid', async () => {
      const response = await chai.request(app).get(`${API_ENDPOINT}/invalid-id`);

      expect(response).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
    });

    it('should return 404 when meteo station does not exist', async () => {
      const response = await chai.request(app).get(`${API_ENDPOINT}/99999999`);

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.MeteoStationNotFound);
    });
  });

  describe('POST /meteo-stations', () => {
    it('should create a meteo station', async () => {
      const payload = {
        name: uniqueStationName('CREATED'),
        longitude: -1.23456789,
        latitude: 42.12345678
      };

      const response = await chai.request(app).post(API_ENDPOINT).send(payload);

      expect(response).to.have.status(StatusCode.SuccessCreated);
      expect(response.body).to.include({
        name: payload.name
      });
      expectStationCoordinates(response.body, payload);

      const persisted = await db('meteo_stations').where({ name: payload.name }).first();
      expect(persisted).to.not.equal(undefined);
    });

    it('should return 409 when creating a duplicated meteo station name', async () => {
      const station = await getSeededStation();

      const response = await chai.request(app).post(API_ENDPOINT).send({
        name: station.name,
        longitude: -2.5,
        latitude: 41.9
      });

      expect(response).to.have.status(StatusCode.ClientErrorConflict);
      expect(response.body).to.have.property('code', APICode.MeteoStationAlreadyExists);
    });

    it('should return 422 when payload is invalid', async () => {
      const response = await chai.request(app).post(API_ENDPOINT).send({
        name: '',
        longitude: 500,
        latitude: 'invalid'
      });

      expect(response).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('errors').that.is.an('array');
    });
  });

  describe('PUT /meteo-stations/:id', () => {
    it('should update a meteo station', async () => {
      const station = await insertTestStation();
      const payload = {
        name: uniqueStationName('UPDATED'),
        longitude: -0.1276,
        latitude: 51.5072
      };

      const response = await chai.request(app).put(`${API_ENDPOINT}/${station.id}`).send(payload);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: station.id,
        name: payload.name
      });
      expectStationCoordinates(response.body, payload);

      const persisted = await db('meteo_stations').where({ id: station.id }).first();
      expect(persisted.name).to.equal(payload.name);
    });

    it('should return 404 when updating a non existing meteo station', async () => {
      const response = await chai
        .request(app)
        .put(`${API_ENDPOINT}/99999999`)
        .send({
          name: uniqueStationName('MISSING'),
          longitude: 1.1,
          latitude: 2.2
        });

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.MeteoStationNotFound);
    });

    it('should return 409 when updating to a duplicated name', async () => {
      const seeded = await getSeededStation();
      const station = await insertTestStation();

      const response = await chai.request(app).put(`${API_ENDPOINT}/${station.id}`).send({
        name: seeded.name,
        longitude: station.longitude,
        latitude: station.latitude
      });

      expect(response).to.have.status(StatusCode.ClientErrorConflict);
      expect(response.body).to.have.property('code', APICode.MeteoStationAlreadyExists);
    });
  });

  describe('DELETE /meteo-stations/:id', () => {
    it('should delete a meteo station', async () => {
      const station = await insertTestStation();

      const response = await chai.request(app).delete(`${API_ENDPOINT}/${station.id}`);

      expect(response).to.have.status(StatusCode.SuccessNoContent);

      const deleted = await db('meteo_stations').where({ id: station.id }).first();
      expect(deleted).to.equal(undefined);
    });

    it('should return 404 when deleting a non existing meteo station', async () => {
      const response = await chai.request(app).delete(`${API_ENDPOINT}/99999999`);

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.MeteoStationNotFound);
    });
  });
});
