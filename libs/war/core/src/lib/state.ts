import { assign, setup, StateFrom } from 'xstate';
import { faker } from '@faker-js/faker';
import { Coords } from '@end/shared';
import { Battle } from './interfaces/Battle';
import { compareDesc } from 'date-fns';
import { groupBy, pipe, shuffle, uniqBy } from 'remeda';
import { Mutable } from 'effect/Types';

export interface Tile {
  habitable: boolean;
  neighborIds: string[];
  id: string;
  troopCount: number;
  owner: string;
  name: string;
  originalOwner: string;
}

interface Context {
  players: { id: string; userName: string; color: string }[];
  playerLimit: number;
  battleLimit: number;
  turn: number;
  tiles: Record<string, Tile>;
  turns?: Record<string, Turn>;
  roundLimit: number;
}

export interface Turn {
  portals: { coords: [Coords?, Coords?]; date: string }[];
  deployments: { deployTo: string; troopsToDeploy: number; date: string }[];
  battles: Battle[];
}

export type Event =
  | {
      type: 'generate-new-war';
      players: { id: string; userName: string; color: string }[];
      tiles: Record<string, Tile>;
      warId: string;
      roundLimit: number;
      battleLimit: number;
      playerLimit: number;
    }
  | {
      type: 'start-battle';
      aggressor: string;
      defender: string;
      attackingFromTerritory: string;
      defendingTerritory: string;
      warId: string;
      id: string;
    }
  | {
      type: 'deploy';
      tile: string;
      troopsToDeploy: number;
      warId: string;
    }
  | {
      type: 'set-portal-entry';
      portal: [Coords?, Coords?];
      warId: string;
    }
  | {
      type: 'complete-turn';
      warId: string;
    }
  | {
      type: 'add-player';
      warId: string;
      player: { id: string; userName: string; color: string };
    }
  | { type: 'attack'; battleId: string; warId: string }
  | { type: 'begin-turn-number-1'; warId: string };

export function getPossibleDeployedTroops(context: Context) {
  return 10;
}

export function getDeployedTroopsForTurn(turn?: Turn) {
  if (!turn) {
    return 0;
  }

  return Object.values(turn.deployments).reduce((acc, curr) => {
    acc = acc + curr.troopsToDeploy;
    return acc;
  }, 0);
}

export function getScoreboard(context: {
  players: readonly {
    readonly id: string;
    readonly userName: string;
    readonly color: string;
  }[];
  tiles: Partial<Tile>[];
}) {
  return context.players
    .reduce(
      (
        acc: {
          totalTroops: number;
          userName: string;
          color: string;
          id: string;
        }[],
        curr
      ) => {
        const owned = Object.values(context.tiles).filter(
          (t) => t.owner === curr.id
        );

        const totalTroops = owned.reduce((acc1, curr1) => {
          acc1 = acc1 + (curr1?.troopCount ?? 0);
          return acc1;
        }, 0);

        acc.push({
          totalTroops,
          userName: curr?.userName ?? '',
          color: curr?.color ?? '',
          id: curr?.id ?? '',
        });
        return acc;
      },
      []
    )
    .sort((a, b) => b.totalTroops - a.totalTroops);
}

export function getDeploymentsByTerritory(
  deployments: {
    deployTo: string;
    troopsToDeploy: number;
    date: string;
  }[],
  tiles: Partial<Tile>[]
) {
  return deployments.reduce(
    (acc: Record<string, [string, number, string | undefined]>, curr) => {
      const tile = tiles.find((t) => t.id === curr.deployTo);
      if (tile?.id && tile?.name) {
        if (acc[tile.id]) {
          acc[tile.id] = [
            tile.name,
            acc[tile.id][1] + curr.troopsToDeploy,
            tile.owner,
          ];
        } else {
          acc[tile.id] = [tile.name, curr.troopsToDeploy, tile.owner];
        }
      }

      return acc;
    },
    {}
  );
}

export function getCurrentUsersTurn(context: {
  players: { id: string }[];
  turn: number;
}) {
  const player = context.players[(context.turn - 1) % context.players.length];
  return player?.id;
}

export function getMostRecentPortal(context: Context) {
  const turn = context.turns?.[context.turn];
  if (!turn) {
    return undefined;
  }
  return turn.portals.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date))
  )?.[0]?.coords;
}

export function getMostRecentDeployment(context: Context) {
  const turn = context.turns?.[context.turn];
  if (!turn) {
    return undefined;
  }
  return turn.deployments.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date))
  )?.[0];
}

export const warMachine = (
  warId: string,
  initialContext?: Context,
  initialState?: string
) =>
  setup({
    types: {
      context: {} as Context,
      events: {} as Event,
    },
    actions: {
      startWar: ({ context, event }) => {
        const numberOfPlayers = context.players.length;
        shuffle(Object.keys(context.tiles)).forEach((tileId, i) => {
          context.tiles[tileId].troopCount = 3;
          const owner = context.players[i % numberOfPlayers].id;
          context.tiles[tileId].owner = owner;
          context.tiles[tileId].originalOwner = owner;
        });

        context.turn = 1;
        context.turns = { 1: { battles: [], deployments: [], portals: [] } };

        return context;
      },
      completeTurn: assign(({ context, event }) => {
        if (event.type !== 'complete-turn' || !context.turns) {
          return context;
        }

        context.turn = context.turn + 1;
        context.turns[context.turn] = {
          portals: [],
          battles: [],
          deployments: [],
        };

        return context;
      }),
      setPortal: assign(({ context, event }) => {
        if (event.type !== 'set-portal-entry' || !context.turns) {
          return context;
        }

        const portals = context.turns[context.turn].portals;
        context.turns[context.turn].portals = [
          ...portals,
          { date: new Date().toUTCString(), coords: event.portal },
        ];

        return context;
      }),
      startBattle: assign(({ context, event }) => {
        if (event.type !== 'start-battle' || !context.turns) {
          return context;
        }

        let currentTurn: Turn = context.turns[context.turn];
        const players = context.players;
        const currentUsersTurn = getCurrentUsersTurn(context);

        const attackingTile = context.tiles[event.attackingFromTerritory];
        const defendingTile = context.tiles[event.defendingTerritory];

        const existingBattle = currentTurn?.battles.find(
          (b) =>
            b.defendingTerritory === defendingTile.id &&
            b.attackingFromTerritory === attackingTile.id
        );

        if (existingBattle) {
          return context;
        }

        if (attackingTile.troopCount === 1) {
          return context;
        }

        const maxDefenderChange = Math.ceil(defendingTile.troopCount / 2);
        const maxAggressorChange = Math.ceil(attackingTile.troopCount / 2);

        const aggressorChange = -1;
        const defenderChange = faker.number.int({
          max: 0,
          min: -1,
        });

        const battleEvent = {
          date: new Date().toUTCString(),
          aggressorChange,
          defenderChange,
        };

        // TODO verify that this is even possible/abiding by the rules
        const battle: Battle = {
          attackingFromTerritory: event.attackingFromTerritory,
          createdDate: new Date().toUTCString(),
          defender: event.defender,
          aggressorInitialTroopCount: Number(attackingTile.troopCount),
          defenderInitialTroopCount: Number(defendingTile.troopCount),
          defendingTerritory: event.defendingTerritory,
          aggressor: currentUsersTurn,
          events: [battleEvent],
          id: event.id,
        };

        currentTurn.battles = [battle, ...(currentTurn?.battles ?? [])];

        context.turns = { ...context.turns, [context.turn]: currentTurn };

        if (attackingTile) {
          attackingTile.troopCount =
            attackingTile.troopCount + battleEvent.aggressorChange;
        }

        if (defendingTile) {
          defendingTile.troopCount =
            defendingTile.troopCount + battleEvent.defenderChange;
        }

        return context;
      }),
      deploy: assign(({ context, event }) => {
        if (event.type !== 'deploy' || !context.turns) {
          return context;
        }
        let { troopCount } = context.tiles[event.tile];

        const deployments = context.turns[context.turn].deployments;
        context.turns[context.turn].deployments = [
          ...deployments,
          {
            date: new Date().toUTCString(),
            troopsToDeploy: event.troopsToDeploy,
            deployTo: event.tile,
          },
        ];

        context.tiles[event.tile] = {
          ...context.tiles[event.tile],
          troopCount: troopCount + event.troopsToDeploy,
        };
        return context;
      }),
      attack: assign(({ context, event }) => {
        if (
          event.type !== 'attack' ||
          !context.turns ||
          !context.turns[context.turn]?.battles
        ) {
          return context;
        }
        const battle = context.turns[context.turn].battles.find(
          (b) => b.id === event.battleId
        );
        if (!battle) {
          return context;
        }
        const {
          defendingTerritory,
          attackingFromTerritory,
          aggressor,
          defender,
        } = battle;

        let { troopCount: defendingTroopCount } =
          context.tiles[defendingTerritory];
        let { troopCount: attackingTroopCount } =
          context.tiles[attackingFromTerritory];

        if (attackingTroopCount === 1) {
          return context;
        }

        const maxDefenderChange =
          defendingTroopCount < 10 ? 5 : Math.ceil(defendingTroopCount / 2);
        const maxAggressorChange =
          attackingTroopCount < 10 ? 5 : Math.ceil(attackingTroopCount / 2);

        const aggressorChange = faker.number.int({
          max: 0,
          min: -1,
        });
        const defenderChange = faker.number.int({
          max: 0,
          min: -1,
        });

        const battleEvent = {
          date: new Date().toUTCString(),
          aggressorChange,
          defenderChange,
        };

        battle.events = [...(battle.events ?? []), battleEvent];

        const newAggressorTroopCount =
          Number(attackingTroopCount) + aggressorChange;
        const newDefenderTroopCount =
          Number(defendingTroopCount) + defenderChange;

        context.tiles[attackingFromTerritory] = {
          ...context.tiles[attackingFromTerritory],
          troopCount: newAggressorTroopCount < 1 ? 1 : newAggressorTroopCount,
        };

        context.tiles[defendingTerritory] = {
          ...context.tiles[defendingTerritory],
          troopCount: newDefenderTroopCount < 1 ? 1 : newDefenderTroopCount,
          owner: newDefenderTroopCount < 1 ? aggressor : defender,
        };

        return context;
      }),
      'generate-new-war': assign(({ context, event }) => {
        if (event.type !== 'generate-new-war') {
          return context;
        }
        context.turn = 0;
        context.roundLimit = event.roundLimit;
        context.battleLimit = event.battleLimit;
        context.playerLimit = event.playerLimit;
        context.tiles = event.tiles;
        context.players = event.players;
        context.turns = {};

        return context;
      }),
    },
    guards: {
      isWarComplete: ({ context }) => {
        if (!context.turns) {
          return false;
        }

        const domination = groupBy(
          Object.values(context.tiles),
          (t) => t.owner
        );

        const round = Math.ceil(
          Object.keys(context.turns).length / context.players.length
        );

        return (
          (context.roundLimit === 0 ? false : round > context.roundLimit) ||
          Object.keys(domination).length === 1
        );
      },
      hasEnoughPlayers: ({ context }) => {
        return context.players.length >= context.playerLimit;
      },
      canDeploy: ({ context, event }) => {
        if (event.type !== 'deploy' || !context.turns) {
          return false;
        }

        const possibleTroops = getPossibleDeployedTroops(context);
        const alreadyDeployed = getDeployedTroopsForTurn(
          context.turns[context.turn]
        );

        return possibleTroops - alreadyDeployed - event.troopsToDeploy >= 0;
      },
    },
  }).createMachine({
    id: `war-${warId}`,
    initial: initialState ?? 'war-created',
    context:
      initialContext ??
      ({
        players: [],
        turn: 0,
        playerLimit: 0,
        battleLimit: 0,
        tiles: {} as Record<string, Tile>,
        turns: {},
        roundLimit: 0,
      } as Context),
    states: {
      'war-created': {
        on: {
          'generate-new-war': {
            actions: 'generate-new-war',
            target: 'searching-for-players',
          },
        },
      },
      'war-complete': {},
      'searching-for-players': {
        on: {
          'add-player': {
            actions: assign({
              players: ({ context, event }) => {
                const newPlayers = [...context['players']];
                newPlayers.push(event.player);
                return newPlayers;
              },
            }),
          },
          'begin-turn-number-1': {
            target: 'war-in-progress',
            actions: 'startWar',
          },
        },
        always: [
          {
            target: 'war-in-progress',
            guard: 'hasEnoughPlayers',
            actions: 'startWar',
          },
        ],
      },
      'war-in-progress': {
        on: {
          'start-battle': {
            actions: 'startBattle',
            target: 'check-war-status',
          },
          'set-portal-entry': {
            actions: 'setPortal',
          },
          attack: {
            actions: 'attack',
            target: 'check-war-status',
          },
          'complete-turn': {
            actions: 'completeTurn',
            target: 'check-war-status',
          },
          deploy: {
            actions: 'deploy',
            guard: 'canDeploy',
          },
        },
      },
      'check-war-status': {
        always: [
          {
            target: 'war-complete',
            guard: 'isWarComplete',
          },
          {
            target: 'war-in-progress',
          },
        ],
      },
    },
  });

export type WarState = StateFrom<typeof warMachine>['value'];
