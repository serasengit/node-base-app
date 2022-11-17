// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class BaseMapper<K, T> {
  abstract toSchema(dto: T): K;
  abstract toDTO(schema: K): T;
}
