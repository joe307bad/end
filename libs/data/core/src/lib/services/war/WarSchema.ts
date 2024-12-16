import * as S from '@effect/schema/Schema';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

const STile = S.Struct({
  id: S.String,
  selected: S.Boolean,
  defending: S.Boolean,
  raised: S.Boolean,
  name: S.String,
  troopCount: S.Number,
  owner: S.String,
  originalOwner: S.String,
});

const SBattle = S.Struct({
  id: S.String,
  aggressor: S.String,
  defender: S.String,
  attackingFromTerritory: S.String,
  defendingTerritory: S.String,
  events: S.Array(
    S.Struct({
      date: S.String,
      defenderChange: S.Number,
      aggressorChange: S.Number,
    })
  ),
});

const WarStartedTile = S.Struct({
  id: S.String,
  name: S.String,
  troopCount: S.Number,
  owner: S.String,
});

export type Tile = Mutable<S.Schema.Type<typeof STile>>;

export type Battle = Mutable<S.Schema.Type<typeof SBattle>>;

const AttackSchema = S.Struct({
  type: S.Literal('attack'),
  troopUpdates: S.Record({ key: S.String, value: S.Number }),
  ownerUpdates: S.Record({ key: S.String, value: S.String }),
  battle: SBattle,
});

const ObjectSchema = S.Struct({
  x: S.Number,
  y: S.Number,
  z: S.Number,
});

const PortalSetSchema = S.Struct({
  type: S.Literal('portal-entry-set'),
  portal: S.Tuple(ObjectSchema, ObjectSchema),
});

const TurnCompletedSchema = S.Struct({
  type: S.Literal('turn-completed'),
  currentUsersTurn: S.String,
  round: S.Number,
});

const DeploySchema = S.Struct({
  type: S.Literal('deploy'),
  tile: S.String,
  troopsCount: S.Number,
  availableTroopsToDeploy: S.Number,
  deployment: S.Struct({
    deployTo: S.String,
    troopsToDeploy: S.Number,
    date: S.String,
  }),
});

const PlayerJoinedSchema = S.Struct({
  type: S.Literal('player-joined'),
  players: S.Array(
    S.Struct({ userName: S.String, id: S.String, color: S.String })
  ),
});

const WarStartedSchema = S.Struct({
  type: S.Literal('war-started'),
  round: S.Number,
  war: S.Struct({
    id: S.String,
    players: S.Array(
      S.Struct({ userName: S.String, id: S.String, color: S.String })
    ),
    tiles: S.Record({ key: S.String, value: WarStartedTile }),
    playerLimit: S.Number,
    battleLimit: S.Number,
    turn: S.Number,
  }),
});

const BattleStartedSchema = S.Struct({
  type: S.Literal('battle-started'),
  troopUpdates: S.Record({ key: S.String, value: S.Number }),
  battle: SBattle,
});

const WarCompletedSchema = S.Struct({
  type: S.Literal('war-completed'),
});

type PlayerJoined = S.Schema.Type<typeof PlayerJoinedSchema>;

export type Players = PlayerJoined['players'];

export const ResultSchema = S.Union(
  AttackSchema,
  PlayerJoinedSchema,
  DeploySchema,
  PortalSetSchema,
  BattleStartedSchema,
  WarStartedSchema,
  TurnCompletedSchema,
  WarCompletedSchema
);

export type Result = S.Schema.Type<typeof ResultSchema>;
