import { Knex } from 'knex';

const USERS_COUNT = 100;

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const users = Array.from({ length: USERS_COUNT }, (_, index) => {
    const userNumber = index + 1;
    const nifNumber = userNumber.toString().padStart(8, '0');

    return {
      nif: `${nifNumber}A`,
      name: `User ${userNumber}`,
      email: `user${userNumber}@example.com`,
      created_by_id: null,
      updated_by_id: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };
  });

  await knex('users').insert(users);
}
