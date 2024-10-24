import { assign, setup, StateFrom } from 'xstate';
import { faker } from '@faker-js/faker';

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
  selectedTerritory1?: string;
  selectedTerritory2?: string;
}

export type Event =
  | {
      type: 'generate-new-war';
      players: [string, string][];
      tiles: Record<string, Tile>;
      warId: string;
    }
  | {
      type: 'deploy';
      tile: string;
      troopsToDeploy: number;
      warId: string;
    }
  | { type: 'add-player'; warId: string; player: [string, string] }
  | { type: 'attack'; tile1: string; tile2: string; warId: string }
  | { type: 'select-first-territory'; id: string; warId: string }
  | { type: 'select-second-territory'; id: string };

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
    },
    guards: {
      hasEnoughPlayers: ({ context }) => context.players.length >= 3,
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
          'select-first-territory': {
            actions: assign({
              selectedTerritory1: ({ context, event }) => {
                return event.id;
              },
            }),
          },
          'select-second-territory': {
            actions: assign({
              selectedTerritory2: ({ context, event }) => {
                return event.id;
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
