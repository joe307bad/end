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
  owner: number;
  name: string;
}

interface Context {
  players: [string, string][];
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
      players: [string, string][];
      tiles: Record<string, Tile>;
      warId: string;
    }
  | {
      type: 'start-battle';
      aggressor: string;
      defender: string;
      attackingFromTerritory: string;
      defendingTerritory: string;
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
  | { type: 'add-player'; warId: string; player: [string, string] }
  | { type: 'attack'; tile1: string; tile2: string; warId: string };

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
      startBattle: assign(({ context, event }) => {
        if (event.type !== 'start-battle') {
          return context;
        }

        const currentTurn: Turn | undefined = context.turns[context.turn];
        const turn = context.turn;
        const players = context.players;
        const round = Math.floor(turn / players.length);
        const [currentUsersTurn] =
          players[context.turn % context.players.length];

        // TODO verify that this is even possible/abiding by the rules
        const battle: Battle = {
          attackingFromTerritory: event.attackingFromTerritory,
          createdDate: new Date(),
          defender: event.defender,
          defendingTerritory: event.defendingTerritory,
          aggressor: currentUsersTurn,
        };

        currentTurn.battles = [battle, ...currentTurn.battles];

        debugger;

        context.turns = { ...context.turns, [context.turn]: currentTurn };

        return context;
      }),
      'generate-new-war': assign({
        turn: () => 1,
        tiles: ({ context, event }) => {
          if (event.type !== 'generate-new-war') return context.tiles;

          Object.keys(event.tiles).forEach((tileId) => {
            event.tiles[tileId].troopCount = faker.number.int({
              min: 5,
              max: 99,
            });
            event.tiles[tileId].owner = faker.datatype.boolean(0.5) ? 1 : 2;
          });

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
                let { troopCount: tile1TroopCount } =
                  context.tiles[event.tile1];
                let { troopCount: tile2TroopCount } =
                  context.tiles[event.tile2];
                // let { troopCount: tile2TroopCount } =
                //   context.tiles[event.tile2];

                context.tiles[event.tile1] = {
                  ...context.tiles[event.tile1],
                  troopCount: tile1TroopCount - 1,
                };

                context.tiles[event.tile2] = {
                  ...context.tiles[event.tile2],
                  troopCount: tile2TroopCount - 1,
                };
                // context.tiles[event.tile2] = {
                //   ...context.tiles[event.tile2],
                //   // troopCount: tile2TroopCount - 1,
                // };

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
