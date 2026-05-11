import { APICode } from '@api-messages/api-messages';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { knex, Knex } from 'knex';
import { after, afterEach, before, describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import app from '../../../../server';
import { loginAsSystemAdmin, withBearerToken } from '../../../test-setup/auth-test-helper';

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

const API_ENDPOINT = `/${process.env.SERVER_API}/cities`;
const TEST_PREFIX = 'TEST_CITY_';
let accessToken = '';

type CityRecord = {
  id: number;
  name: string;
  province: string | null;
  country: string;
  created_by_id?: number | null;
  updated_by_id?: number | null;
};

type UserRecord = {
  id: number;
  username: string;
};

function uniqueCityName(suffix: string): string {
  return `${TEST_PREFIX}${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function getSeededCity(): Promise<CityRecord> {
  const city = await db<CityRecord>('cities').select('*').orderBy('id', 'asc').first();

  if (!city) {
    throw new Error('Expected seeded cities in test database.');
  }

  return city;
}

async function getSystemAdminUser(): Promise<UserRecord> {
  const user = await db<UserRecord>('rbac.users').where({ username: 'system_admin' }).first();

  if (!user) {
    throw new Error('Expected seeded system administrator in test database.');
  }

  return user;
}

async function insertTestCity(overrides: Partial<CityRecord> = {}): Promise<CityRecord> {
  const [city] = await db<CityRecord>('cities')
    .insert({
      name: overrides.name ?? uniqueCityName('INSERTED'),
      province: overrides.province ?? 'Madrid',
      country: overrides.country ?? 'Spain',
      created_by_id: overrides.created_by_id ?? null,
      updated_by_id: overrides.updated_by_id ?? null
    })
    .returning('*');

  return city;
}

async function insertTestMeteoStation(cityId: number): Promise<void> {
  await db('meteo_stations').insert({
    name: `${TEST_PREFIX}STATION_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    longitude: -3.70379,
    latitude: 40.41678,
    city_id: cityId
  });
}

async function cleanupTestData(): Promise<void> {
  await db('meteo_stations').where('name', 'like', `${TEST_PREFIX}%`).del();
  await db('cities').where('name', 'like', `${TEST_PREFIX}%`).del();
}

describe('Cities API', function () {
  before(async () => {
    accessToken = await loginAsSystemAdmin();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  after(async () => {
    await db.destroy();
  });

  describe('GET /cities', () => {
    it('should list cities', async () => {
      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('total').that.is.a('number');
      expect(response.body).to.have.property('records').that.is.an('array');
      expect(response.body.records[0]).to.include.all.keys('id', 'name', 'country');
    });

    it('should filter cities by textSearch', async () => {
      const city = await insertTestCity({ name: uniqueCityName('SEARCHABLE') });

      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken).query({ textSearch: city.name });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body.records.some((record) => record.id === city.id)).to.equal(true);
    });

    it('should return 422 when orderBy is invalid', async () => {
      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken).query({ orderBy: 'invalidColumn' });

      expect(response).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
    });
  });

  describe('GET /cities/:id', () => {
    it('should fetch one city by id', async () => {
      const city = await getSeededCity();

      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/${city.id}`), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: city.id,
        name: city.name,
        country: city.country
      });
    });

    it('should include meteo stations when requested', async () => {
      const city = await insertTestCity();
      await insertTestMeteoStation(city.id);

      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/${city.id}`), accessToken).query({
        include: 'meteoStations'
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('meteoStations').that.is.an('array');
      expect(response.body.meteoStations.length).to.be.greaterThan(0);
    });

    it('should include createdBy and updatedBy when requested', async () => {
      const systemAdmin = await getSystemAdminUser();
      const city = await insertTestCity({
        created_by_id: systemAdmin.id,
        updated_by_id: systemAdmin.id
      });

      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/${city.id}`), accessToken).query({
        include: 'createdBy,updatedBy'
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('createdBy');
      expect(response.body.createdBy).to.include({
        id: systemAdmin.id,
        username: systemAdmin.username
      });
      expect(response.body).to.have.property('updatedBy');
      expect(response.body.updatedBy).to.include({
        id: systemAdmin.id,
        username: systemAdmin.username
      });
    });

    it('should return 404 when city does not exist', async () => {
      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/99999999`), accessToken);

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.CityNotFound);
    });
  });

  describe('POST /cities', () => {
    it('should create a city', async () => {
      const systemAdmin = await getSystemAdminUser();
      const payload = {
        name: uniqueCityName('CREATED'),
        province: 'La Rioja',
        country: 'Spain'
      };

      const response = await withBearerToken(chai.request(app).post(API_ENDPOINT), accessToken).send(payload);

      expect(response).to.have.status(StatusCode.SuccessCreated);
      expect(response.body).to.include(payload);

      const persisted = await db('cities').where({ name: payload.name, country: payload.country }).first();
      expect(persisted).to.not.equal(undefined);
      expect(persisted.created_by_id).to.equal(systemAdmin.id);
      expect(persisted.updated_by_id).to.equal(systemAdmin.id);
    });

    it('should return 409 when creating a duplicated city', async () => {
      const city = await insertTestCity();

      const response = await withBearerToken(chai.request(app).post(API_ENDPOINT), accessToken).send({
        name: city.name,
        province: city.province,
        country: city.country
      });

      expect(response).to.have.status(StatusCode.ClientErrorConflict);
      expect(response.body).to.have.property('code', APICode.CityAlreadyExists);
    });
  });

  describe('PUT /cities/:id', () => {
    it('should update a city', async () => {
      const systemAdmin = await getSystemAdminUser();
      const city = await insertTestCity();
      const payload = {
        name: uniqueCityName('UPDATED'),
        province: 'Navarra',
        country: 'Spain'
      };

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${city.id}`), accessToken).send(payload);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: city.id,
        ...payload
      });

      const persisted = await db('cities').where({ id: city.id }).first();
      expect(persisted.updated_by_id).to.equal(systemAdmin.id);
    });

    it('should return 404 when updating a non existing city', async () => {
      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/99999999`), accessToken).send({
        name: uniqueCityName('MISSING'),
        province: 'Madrid',
        country: 'Spain'
      });

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.CityNotFound);
    });
  });

  describe('DELETE /cities/:id', () => {
    it('should delete a city', async () => {
      const city = await insertTestCity();

      const response = await withBearerToken(chai.request(app).delete(`${API_ENDPOINT}/${city.id}`), accessToken);

      expect(response).to.have.status(StatusCode.SuccessNoContent);

      const deleted = await db('cities').where({ id: city.id }).first();
      expect(deleted).to.equal(undefined);
    });
  });
});
