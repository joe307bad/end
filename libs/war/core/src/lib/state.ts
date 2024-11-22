import { assign, setup, StateFrom } from 'xstate';
import { faker } from '@faker-js/faker';
import { Coords } from '@end/shared';
import { undefined } from 'effect/Match';
import { Battle } from './interfaces/Battle';

export interface Tile {
  habitable: boolean;
  neighborIds: string[];
  id: string;
  troopCount: number;
  owner: string;
  name: string;
}

interface Context {
  players: { id: string; userName: string; color: string }[];
  playerLimit: 2;
  battleLimit: 2;
  turn: number;
  tiles: Record<string, Tile>;
  portal: [Coords?, Coords?];
  turns: Record<string, Turn>;
}

interface Turn {
  battles: Battle[];
}

export type Event =
  | {
      type: 'generate-new-war';
      players: { id: string; userName: string; color: string }[];
      tiles: Record<string, Tile>;
      warId: string;
    }
  | {
      type: 'start-battle';
      aggressor: string;
      defender: string;
      attackingFromTerritory: string;
      defendingTerritory: string;
      warId: string;
      id?: string;
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
  | { type: 'attack'; battleId: string; warId: string };

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
      assignOwners: ({ context, event }) => {
        const numberOfPlayers = context.players.length;
        Object.keys(context.tiles).forEach((tileId) => {
          context.tiles[tileId].troopCount = faker.number.int({
            min: 5,
            max: 99,
          });
          context.tiles[tileId].owner =
            context.players[
              faker.number.int({
                min: 0,
                max: numberOfPlayers - 1,
              })
            ].id;
        });
        return context.players;
      },
      startBattle: assign(({ context, event }) => {
        if (event.type !== 'start-battle') {
          return context;
        }

        let currentTurn: Turn | undefined = context.turns[context.turn];
        const turn = context.turn;
        const players = context.players;
        const round = Math.floor(turn / players.length);
        const { id: currentUsersTurn } =
          players[context.turn % context.players.length];

        const e = { date: new Date(), aggressorChange: 0, defenderChange: -1 };
        const attackingTile = context.tiles[event.attackingFromTerritory];
        const defendingTile = context.tiles[event.attackingFromTerritory];

        // TODO verify that this is even possible/abiding by the rules
        const battle: Battle = {
          attackingFromTerritory: event.attackingFromTerritory,
          createdDate: new Date(),
          defender: event.defender,
          aggressorInitialTroopCount: attackingTile.troopCount,
          defenderInitialTroopCount: defendingTile.troopCount,
          defendingTerritory: event.defendingTerritory,
          aggressor: currentUsersTurn,
          events: [e],
          id: event.id,
        };

        if (!currentTurn) {
          currentTurn = {
            battles: [],
          };
        }

        currentTurn.battles = [battle, ...(currentTurn?.battles ?? [])];

        context.turns = { ...context.turns, [context.turn]: currentTurn };

        if (attackingTile) {
          attackingTile.troopCount =
            attackingTile.troopCount + e.aggressorChange;
        }

        if (defendingTile) {
          defendingTile.troopCount =
            defendingTile.troopCount + e.defenderChange;
        }

        return context;
      }),
      'generate-new-war': assign({
        turn: () => 1,
        tiles: ({ context, event }) => {
          if (event.type !== 'generate-new-war') return context.tiles;
          return event.tiles;
        },
        players: ({ context, event }) => {
          if (event.type !== 'generate-new-war') return context.players;

          return event.players;
        },
      }),
      // setWarContext: assign({
      //   round: () => 1,
      // }),
    },
    guards: {
      hasEnoughPlayers: ({ context }) => context.players.length >= 2,
    },
  }).createMachine({
    id: `war-${warId}`,
    initial: initialState ?? 'war-created',
    context:
      initialContext ??
      ({
        players: [],
        turn: 0,
        playerLimit: 2,
        battleLimit: 2,
        tiles: {} as Record<string, Tile>,
        portal: [undefined, undefined] as any,
        turns: {},
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
        },
        always: [
          {
            target: 'war-in-progress',
            guard: 'hasEnoughPlayers',
            actions: 'assignOwners',
          },
        ],
      },
      'war-in-progress': {
        on: {
          //   'complete-turn': {
          //     actions: assign({
          //       turn: ({ context, event }) => {
          //         return context.turn > context.players.length + 1
          //           ? 1
          //           : context.turn + 1;
          //       },
          //       round: ({ context }) => {
          //         return context.turn > context.players.length + 1
          //           ? context.round + 1
          //           : context.round;
          //       },
          //     }),
          //   },
          'start-battle': {
            actions: 'startBattle',
          },
          'set-portal-entry': {
            actions: assign({
              portal: ({ context, event }) => {
                return event.portal;
              },
            }),
          },
          attack: {
            actions: assign({
              tiles: ({ context, event }) => {
                const battle = context.turns[context.turn].battles.find(
                  (b) => b.id === event.battleId
                );

                if (!battle) {
                  return context.tiles;
                }

                const { defendingTerritory, attackingFromTerritory } = battle;

                let { troopCount: tile1TroopCount } =
                  context.tiles[defendingTerritory];
                let { troopCount: tile2TroopCount } =
                  context.tiles[attackingFromTerritory];
                // let { troopCount: tile2TroopCount } =
                //   context.tiles[event.tile2];

                context.tiles[defendingTerritory] = {
                  ...context.tiles[defendingTerritory],
                  troopCount: tile1TroopCount - 1,
                };

                context.tiles[attackingFromTerritory] = {
                  ...context.tiles[attackingFromTerritory],
                  troopCount: tile2TroopCount - 1,
                };

                return context.tiles;
              },
            }),
          },
          deploy: {
            actions: assign({
              tiles: ({ context, event }) => {
                let { troopCount } = context.tiles[event.tile];

                context.tiles[event.tile] = {
                  ...context.tiles[event.tile],
                  troopCount: troopCount + event.troopsToDeploy,
                };

                return context.tiles;
              },
            }),
          },
        },
      },
    },
  });

export type WarState = StateFrom<typeof warMachine>['value'];
