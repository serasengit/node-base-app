// Import the dependencies for testing

import * as dotenv from 'dotenv';

import chai, { expect } from 'chai';

import StatusCode from 'status-code-enum';
import chaiHttp from 'chai-http';
import faker from 'faker';
import app from '../../server';

dotenv.config();

// Configure chai
chai.use(chaiHttp);

describe('MeteoStations: ', () => {
  const mainPath: string = `/api/${process.env.API_VERSION}/meteo-stations`;
  it('Find all meteo stations - SUCCESS', (done) => {
    chai
      .request(app)
      .get(`${mainPath}`)
      .end((err, res) => {
        expect(res).to.have.status(StatusCode.SuccessOK);
        expect(res).to.have.nested.property('body[0]').that.includes.all.keys(['id', 'name', 'longitude', 'latitude']);
        done();
      });
  });
  it('Find meteo station by id - ERROR', (done) => {
    chai
      .request(app)
      .get(`${mainPath}/${faker.lorem.word()}`)
      .end((err, res) => {
        expect(res).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
        done();
      });
  });
  it('Find meteo station by id - SUCCESS', (done) => {
    chai
      .request(app)
      .get(`${mainPath}/1`)
      .end((err, res) => {
        expect(res).to.have.status(StatusCode.SuccessOK);
        expect(res.body).to.not.be.empty;
        expect(res.body['name']).to.be.equal('Meteo 1');
        done();
      });
  });
});
