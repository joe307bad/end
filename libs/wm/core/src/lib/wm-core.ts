import 'reflect-metadata';
import {
  appSchema,
  Database,
  DatabaseAdapter,
  tableSchema,
} from '@nozbe/watermelondb';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { synchronize } from '@nozbe/watermelondb/sync';

export class Planet extends Model {
  static override table = 'planets';
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

export const syncFactory = (database: Database) => (token: string | null, apiUrl?: string) =>
  synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const urlParams = `last_pulled_at=${lastPulledAt}&schema_version=${schemaVersion}&migration=${encodeURIComponent(
        JSON.stringify(migration)
      )}&tables=${JSON.stringify(Object.keys(schema.tables))}`;
      const response = await fetch(
        `${apiUrl}/sync?${urlParams}`,
        {
          method: 'GET',
          headers: new Headers({
            Authorization: `Bearer ${token}`,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      const response = await fetch(
        `${apiUrl}/sync?last_pulled_at=${lastPulledAt}`,
        {
          method: 'POST',
          headers: new Headers({
            'Content-type': 'application/json',
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify(changes),
        }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    migrationsEnabledAtVersion: 1,
  });
