import 'reflect-metadata';
import {
  appSchema, ColumnSchema,
  Database,
  DatabaseAdapter,
  Q,
  Relation,
  tableSchema
} from '@nozbe/watermelondb';
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
import { Model } from '@nozbe/watermelondb';
import { date, field, lazy, readonly, relation } from '@nozbe/watermelondb/decorators';
import { synchronize } from '@nozbe/watermelondb/sync';
import { IWar, IPlanet, IUser, WarState } from '@end/war/core';
import { Associations } from '@nozbe/watermelondb/Model';

export class BaseModel extends Model {
  @field('deleted') deleted!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Planet extends BaseModel implements IPlanet {
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

export class War extends BaseModel implements IWar {
  static override table = 'wars';

  static override associations: Associations = {
    war_users: {
      type: 'has_many',
      foreignKey: 'war_id',
    },
  };

  @relation('users', 'victor_id')
  victor!: Relation<User>;
  @field('players')
  players!: number;
  @relation('war_turns', 'turn_id')
  turn!: Relation<User>;
  @field('status')
  status!: WarState;
  @relation('planets', 'planet_id')
  planet!: Relation<Planet>;

  //@lazy
  get users() {
    return this.collections
      .get<User>('users')
      .query(Q.on('war_users', 'war_id', this.id));
  }
}

export class User extends BaseModel implements IUser {
  static override associations: Associations = {
    war_users: {
      type: 'has_many',
      foreignKey: 'user_id',
    },
  };

  static override table = 'users';
  @field('userName')
  userName!: string;
  @field('password_id')
  password_id!: string;

  // @lazy
  get wars() {
    return this.collections
      .get<War>('wars')
      .query(Q.on('war_users', 'user_id', this.id))
  };
}

export class WarUser extends BaseModel {
  static override table = 'war_users';
  static override associations: Associations = {
    wars: { type: 'belongs_to', key: 'war_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  };
  @field('war_id') warId!: string;
  @field('user_id') userId!: string;

  @relation('wars', 'war_id') war!: IWar;
  @relation('users', 'user_id') user!: IUser;
}

export class WarTurn extends BaseModel {
  static override table = 'war_turns';
  static override associations: Associations = {
    wars: { type: 'belongs_to', key: 'war_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  };
  @field('war_id') warId!: string;
  @field('user_id') userId!: string;

  @relation('wars', 'war_id') war!: IWar;
  @relation('users', 'user_id') user!: IUser;
}

export const databaseFactory = (adapter: DatabaseAdapter) =>
  new Database({
    adapter,
    modelClasses: [Planet, War, User, WarUser, WarTurn],
  });

const baseColumns = (schema: ColumnSchema[]): ColumnSchema[] => [
  ...schema,
  { name: 'deleted', type: 'boolean' },
  { name: 'created_at', type: 'number' },
  { name: 'updated_at', type: 'number' }
];
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'planets',
      columns: baseColumns([
        { name: 'name', type: 'string' },
        { name: 'raised', type: 'string' },
        {
          name: 'landColor',
          type: 'string',
        },
        { name: 'waterColor', type: 'string' },
      ]),
    }),
    tableSchema({
      name: 'wars',
      columns:  baseColumns([
        { name: 'status', type: 'string' },
        { name: 'turn_id', type: 'string' },
        { name: 'victor_id', type: 'string' },
        { name: 'planet_id', type: 'string' },
        { name: 'players', type: 'number' },
      ]),
    }),
    tableSchema({
      name: 'users',
      columns:  baseColumns([
        { name: 'userName', type: 'string' },
        { name: 'password_id', type: 'string' },
      ]),
    }),
    tableSchema({
      name: 'war_users',
      columns:  baseColumns([
        { name: 'user_id', type: 'string' },
        { name: 'war_id', type: 'string' },
      ]),
    }),
    tableSchema({
      name: 'war_turns',
      columns:  baseColumns([
        { name: 'user_id', type: 'string' },
        { name: 'war_id', type: 'string' },
      ]),
    })
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
