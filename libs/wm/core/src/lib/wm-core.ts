import 'reflect-metadata';
import {
  appSchema,
  Database,
  DatabaseAdapter,
  Relation,
  tableSchema,
} from '@nozbe/watermelondb';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { synchronize } from '@nozbe/watermelondb/sync';
import { IWar, IPlanet } from '@end/war/core';

export class Planet extends Model implements IPlanet {
  static override table = 'planets';
  @field('name')
  name!: string;
  @field('raised')
  raised!: string;
  @field('landColor')
  landColor!: string;
  @field('waterColor')
  waterColor!: string;
}

export class War extends Model implements IWar {
  static override table = 'wars';
  @field('victor')
  victor!: string;
  @field('players')
  players!: number;
  @relation('planets', 'planet_id')
  planet!: Relation<Planet>;
}

export const databaseFactory = (adapter: DatabaseAdapter) =>
  new Database({
    adapter,
    modelClasses: [Planet, War],
  });

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'planets',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'raised', type: 'string' },
        {
          name: 'landColor',
          type: 'string',
        },
        { name: 'waterColor', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'wars',
      columns: [
        { name: 'planet_id', type: 'string' },
        { name: 'players', type: 'number' },
      ],
    }),
  ],
});

export const migrations = schemaMigrations({
  migrations: [
    // We'll add migration definitions here later
  ],
});

export const syncFactory =
  (database: Database) => (token: string | undefined, apiUrl?: string) =>
    synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const urlParams = `last_pulled_at=${lastPulledAt}&schema_version=${schemaVersion}&migration=${encodeURIComponent(
          JSON.stringify(migration)
        )}&tables=${JSON.stringify(Object.keys(schema.tables))}`;
        const response = await fetch(`${apiUrl}/sync?${urlParams}`, {
          method: 'GET',
          headers: new Headers({
            Authorization: `Bearer ${token}`,
          }),
        });
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
