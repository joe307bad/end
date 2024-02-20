import "reflect-metadata";
import {
  appSchema,
  Database,
  DatabaseAdapter,
  tableSchema,
} from '@nozbe/watermelondb';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class Planet extends Model {
  static table = 'planets';
  // @ts-ignore
  @field('name') name: string;
}

export const databaseFactory = (adapter: DatabaseAdapter) =>
  new Database({
    adapter,
    modelClasses: [Planet],
  });

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'planets',
      columns: [{ name: 'name', type: 'string' }],
    }),
  ],
});

export const migrations = schemaMigrations({
  migrations: [
    // We'll add migration definitions here later
  ],
});
