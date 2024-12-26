import 'reflect-metadata';
import {
  appSchema,
  Database,
  DatabaseAdapter, Q,
  Relation,
  tableSchema
} from '@nozbe/watermelondb';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { Model } from '@nozbe/watermelondb';
import { field, lazy, relation } from '@nozbe/watermelondb/decorators';
import { synchronize } from '@nozbe/watermelondb/sync';
import { IWar, IPlanet, IUser } from '@end/war/core';
import { Associations } from '@nozbe/watermelondb/Model';

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

  static override associations: Associations = {
    war_users: {
      type: 'has_many',
      foreignKey: 'war_id'
    },
  };

  @field('victor')
  victor!: string;
  @field('players')
  players!: number;
  @relation('planets', 'planet_id')
  planet!: Relation<Planet>;

  @lazy
  users = this.collections
    .get<User>('users')
    .query(Q.on('war_users', 'war_id', this.id));
}

export class User extends Model implements IUser {
  static override table = 'users';
  @field('userName')
  userName!: string;
  @field('passwordId')
  passwordId!: string;
}

class WarUser extends Model {
  static override table = 'war_users'
  static override  associations: Associations = {
    wars: { type: 'belongs_to', key: 'war_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  }

  @relation('wars', 'war_id') war!: IWar
  @relation('users', 'user_id') user!: IUser
}


export const databaseFactory = (adapter: DatabaseAdapter) =>
  new Database({
    adapter,
    modelClasses: [Planet, War, User, WarUser],
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
    tableSchema({
      name: 'users',
      columns: [
        { name: 'userName', type: 'string' },
        { name: 'passwordId', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'war_users',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'war_id', type: 'string' },
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
