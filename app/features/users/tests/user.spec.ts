import { APICode } from '@api-messages/api-messages';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { knex, Knex } from 'knex';
import { after, afterEach, before, describe, it } from 'mocha';
import StatusCode from 'status-code-enum';
import app from '../../../../server';
import { loginAsReadOnly, loginAsSystemAdmin, withBearerToken } from '../../../test-setup/auth-test-helper';

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

const API_ENDPOINT = `/${process.env.SERVER_API}/users`;
const TEST_PREFIX = 'TEST_USER_';
let accessToken = '';
let readonlyAccessToken = '';

type UserRecord = {
  id: number;
  username: string;
  password?: string;
  nif: string;
  name?: string | null;
  email?: string | null;
  language: string;
  role_id: number;
  is_active: boolean;
  created_by_id?: number | null;
  updated_by_id?: number | null;
};

type RoleRecord = {
  id: number;
  code: string;
};

function uniqueUsername(suffix: string): string {
  return `${TEST_PREFIX}${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`.slice(0, 100);
}

function uniqueNif(): string {
  return `${Math.floor(10000000 + Math.random() * 89999999)}A`;
}

function uniqueEmail(suffix: string): string {
  return `${TEST_PREFIX.toLowerCase()}${suffix.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

async function getSeededUser(): Promise<UserRecord> {
  const user = await db<UserRecord>('rbac.users').whereNot({ username: 'system_admin' }).orderBy('id', 'asc').first();

  if (!user) {
    throw new Error('Expected seeded users in test database.');
  }

  return user;
}

async function getSystemAdminUser(): Promise<UserRecord> {
  const user = await db<UserRecord>('rbac.users').where({ username: 'system_admin' }).first();

  if (!user) {
    throw new Error('Expected seeded system administrator in test database.');
  }

  return user;
}

async function getRoleByCode(code: string): Promise<RoleRecord> {
  const role = await db<RoleRecord>('rbac.roles').where({ code }).first();

  if (!role) {
    throw new Error(`Expected seeded role with code ${code}.`);
  }

  return role;
}

async function insertTestUser(overrides: Partial<UserRecord> = {}): Promise<UserRecord> {
  const readonlyRole = await getRoleByCode('read_only');

  const [user] = await db<UserRecord>('rbac.users')
    .insert({
      username: overrides.username ?? uniqueUsername('INSERTED'),
      password: overrides.password ?? '$2b$10$abcdefghijklmnopqrstuv',
      nif: overrides.nif ?? uniqueNif(),
      name: overrides.name ?? 'Inserted Test User',
      email: overrides.email ?? uniqueEmail('inserted'),
      language: overrides.language ?? 'es',
      role_id: overrides.role_id ?? readonlyRole.id,
      is_active: overrides.is_active ?? true,
      created_by_id: overrides.created_by_id ?? null,
      updated_by_id: overrides.updated_by_id ?? null
    })
    .returning('*');

  return user;
}

async function cleanupTestUsers(): Promise<void> {
  await db('rbac.users').where('username', 'like', `${TEST_PREFIX}%`).del();
}

describe('Users API', function () {
  before(async () => {
    accessToken = await loginAsSystemAdmin();
    readonlyAccessToken = await loginAsReadOnly();
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  after(async () => {
    await db.destroy();
  });

  describe('GET /users', () => {
    it('should list users', async () => {
      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('total').that.is.a('number');
      expect(response.body).to.have.property('records').that.is.an('array');
      expect(response.body.records[0]).to.include.all.keys('id', 'username', 'nif', 'isActive');
      expect(response.body.records[0]).to.not.have.property('password');
    });

    it('should filter users by textSearch', async () => {
      const user = await insertTestUser({ name: 'Searchable Test User' });

      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken).query({ textSearch: user.name });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body.records.some((record) => record.id === user.id)).to.equal(true);
    });

    it('should return 422 when orderBy is invalid', async () => {
      const response = await withBearerToken(chai.request(app).get(API_ENDPOINT), accessToken).query({ orderBy: 'invalidColumn' });

      expect(response).to.have.status(StatusCode.ClientErrorUnprocessableEntity);
      expect(response.body).to.have.property('code', APICode.ClientErrorUnprocessableEntity);
    });
  });

  describe('GET /users/:id', () => {
    it('should fetch one user by id', async () => {
      const user = await getSeededUser();

      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/${user.id}`), accessToken);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: user.id,
        username: user.username,
        nif: user.nif
      });
      expect(response.body).to.not.have.property('password');
    });

    it('should include role, createdBy and updatedBy when requested', async () => {
      const systemAdmin = await getSystemAdminUser();
      const readonlyRole = await getRoleByCode('read_only');
      const user = await insertTestUser({
        role_id: readonlyRole.id,
        created_by_id: systemAdmin.id,
        updated_by_id: systemAdmin.id
      });

      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/${user.id}`), accessToken).query({
        include: 'role,createdBy,updatedBy'
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.have.property('role');
      expect(response.body.role).to.include({
        id: readonlyRole.id,
        code: readonlyRole.code
      });
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

    it('should return 404 when user does not exist', async () => {
      const response = await withBearerToken(chai.request(app).get(`${API_ENDPOINT}/99999999`), accessToken);

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.UserNotFound);
    });
  });

  describe('POST /users', () => {
    it('should create a user', async () => {
      const systemAdmin = await getSystemAdminUser();
      const readonlyRole = await getRoleByCode('read_only');
      const payload = {
        username: uniqueUsername('CREATED'),
        password: 'UserPass123!',
        nif: uniqueNif(),
        name: 'Created Test User',
        email: uniqueEmail('created'),
        language: 'es',
        roleId: readonlyRole.id,
        isActive: true
      };

      const response = await withBearerToken(chai.request(app).post(API_ENDPOINT), accessToken).send(payload);

      expect(response).to.have.status(StatusCode.SuccessCreated);
      expect(response.body).to.include({
        username: payload.username,
        nif: payload.nif,
        email: payload.email,
        language: payload.language,
        isActive: payload.isActive
      });
      expect(response.body).to.not.have.property('password');

      const persisted = await db<UserRecord>('rbac.users').where({ username: payload.username }).first();
      expect(persisted).to.not.equal(undefined);
      expect(persisted.password).to.not.equal(payload.password);
      expect(persisted.created_by_id).to.equal(systemAdmin.id);
      expect(persisted.updated_by_id).to.equal(systemAdmin.id);
    });

    it('should return 409 when creating a duplicated user', async () => {
      const existingUser = await getSeededUser();
      const readonlyRole = await getRoleByCode('read_only');

      const response = await withBearerToken(chai.request(app).post(API_ENDPOINT), accessToken).send({
        username: existingUser.username,
        password: 'UserPass123!',
        nif: uniqueNif(),
        name: 'Duplicated User',
        email: uniqueEmail('duplicated'),
        language: 'es',
        roleId: readonlyRole.id,
        isActive: true
      });

      expect(response).to.have.status(StatusCode.ClientErrorConflict);
      expect(response.body).to.have.property('code', APICode.UserAlreadyExists);
    });

    it('should return 404 when creating a user with a non existing role', async () => {
      const response = await withBearerToken(chai.request(app).post(API_ENDPOINT), accessToken).send({
        username: uniqueUsername('INVALID_ROLE'),
        password: 'UserPass123!',
        nif: uniqueNif(),
        name: 'Invalid Role User',
        email: uniqueEmail('invalid_role'),
        language: 'es',
        roleId: 99999999,
        isActive: true
      });

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.RoleNotFound);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update the same user info without raising duplicate conflicts', async () => {
      const systemAdmin = await getSystemAdminUser();
      const readonlyRole = await getRoleByCode('read_only');
      const user = await insertTestUser({
        role_id: readonlyRole.id,
        name: 'Same Info User',
        email: uniqueEmail('same_info')
      });

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${user.id}`), accessToken).send({
        username: user.username,
        nif: user.nif,
        name: user.name,
        email: user.email,
        language: user.language,
        roleId: user.role_id,
        isActive: user.is_active
      });

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: user.id,
        username: user.username,
        nif: user.nif,
        email: user.email,
        language: user.language,
        isActive: user.is_active
      });
      expect(response.body).to.not.have.property('password');

      const persisted = await db<UserRecord>('rbac.users').where({ id: user.id }).first();
      expect(persisted.updated_by_id).to.equal(systemAdmin.id);
    });

    it('should update a user', async () => {
      const systemAdmin = await getSystemAdminUser();
      const readonlyRole = await getRoleByCode('read_only');
      const user = await insertTestUser();
      const payload = {
        username: uniqueUsername('UPDATED'),
        password: 'NewPass123!',
        nif: uniqueNif(),
        name: 'Updated Test User',
        email: uniqueEmail('updated'),
        language: 'en',
        roleId: readonlyRole.id,
        isActive: false
      };

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${user.id}`), accessToken).send(payload);

      expect(response).to.have.status(StatusCode.SuccessOK);
      expect(response.body).to.include({
        id: user.id,
        username: payload.username,
        nif: payload.nif,
        email: payload.email,
        language: payload.language,
        isActive: payload.isActive
      });
      expect(response.body).to.not.have.property('password');

      const persisted = await db<UserRecord>('rbac.users').where({ id: user.id }).first();
      expect(persisted.username).to.equal(payload.username);
      expect(persisted.password).to.not.equal(payload.password);
      expect(persisted.updated_by_id).to.equal(systemAdmin.id);
    });

    it('should return 404 when updating a user with a non existing role', async () => {
      const user = await insertTestUser();

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${user.id}`), accessToken).send({
        username: uniqueUsername('MISSING_ROLE'),
        password: 'UserPass123!',
        nif: uniqueNif(),
        name: 'Missing Role User',
        email: uniqueEmail('missing_role'),
        language: 'es',
        roleId: 99999999,
        isActive: true
      });

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.RoleNotFound);
    });

    it('should reject changing the authenticated user role', async () => {
      const systemAdmin = await getSystemAdminUser();
      const readonlyRole = await getRoleByCode('read_only');

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${systemAdmin.id}`), accessToken).send({
        username: systemAdmin.username,
        nif: systemAdmin.nif,
        name: systemAdmin.name,
        email: systemAdmin.email,
        language: systemAdmin.language,
        roleId: readonlyRole.id,
        isActive: systemAdmin.is_active
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidGrants);
    });

    it('should return 404 when updating a non existing user', async () => {
      const readonlyRole = await getRoleByCode('read_only');

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/99999999`), accessToken).send({
        username: uniqueUsername('MISSING'),
        password: 'UserPass123!',
        nif: uniqueNif(),
        name: 'Missing User',
        email: uniqueEmail('missing'),
        language: 'es',
        roleId: readonlyRole.id,
        isActive: true
      });

      expect(response).to.have.status(StatusCode.ClientErrorNotFound);
      expect(response.body).to.have.property('code', APICode.UserNotFound);
    });

    it('should reject read-only users when updating a user', async () => {
      const user = await insertTestUser();

      const response = await withBearerToken(chai.request(app).put(`${API_ENDPOINT}/${user.id}`), readonlyAccessToken).send({
        username: user.username,
        nif: user.nif,
        name: user.name,
        email: user.email,
        language: user.language,
        roleId: user.role_id,
        isActive: user.is_active
      });

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidGrants);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const user = await insertTestUser();

      const response = await withBearerToken(chai.request(app).delete(`${API_ENDPOINT}/${user.id}`), accessToken);

      expect(response).to.have.status(StatusCode.SuccessNoContent);

      const deleted = await db<UserRecord>('rbac.users').where({ id: user.id }).first();
      expect(deleted).to.equal(undefined);
    });

    it('should reject read-only users when deleting a user', async () => {
      const user = await insertTestUser();

      const response = await withBearerToken(chai.request(app).delete(`${API_ENDPOINT}/${user.id}`), readonlyAccessToken);

      expect(response).to.have.status(StatusCode.ClientErrorForbidden);
      expect(response.body).to.have.property('code', APICode.InvalidGrants);
    });
  });
});
