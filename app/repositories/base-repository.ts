/* eslint-disable @typescript-eslint/no-unused-vars */
interface BaseRepository<T> {
  exists(t: T): Promise<boolean>;
  findAll(): Promise<any>;
  update(t: T): Promise<any>;
  delete(t: T): Promise<any>;
  save(t: T): Promise<any>;
}
