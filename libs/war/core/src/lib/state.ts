import { assertEvent, assign, createActor, createMachine, setup } from 'xstate';
import { IPlanet } from './interfaces/Planet';
import { faker } from '@faker-js/faker';

export interface Tile {
  habitable: boolean;
  neighborIds: string[];
  id: string;
  troopCount: number;
  owner: string;
}

interface Context {
  players: string[];
  turn: number;
  tiles: Record<string, Tile>;
}

export type Event =
  | {
      type: 'generate-new-war';
      players: string[];
      tiles: Record<string, Tile>;
      warId: string;
    }
  | { type: 'attack'; tile1: string; tile2: string; warId: string };

export const warMachine = (warId: string, initialContext?: Context) =>
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
            event.tiles[tileId].troopCount = 5;
            event.tiles[tileId].owner = faker.datatype.boolean(0.5) ? '1' : '2';
          });

          return event.tiles;
        },
        players: ({ context, event }) => {
          if (event.type !== 'generate-new-war') return context.players;

          return event.players;
        },
      }),
    },
  }).createMachine({
    id: `war-${warId}`,
    initial: 'war-created',
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
            target: 'war-in-progress',
          },
        },
      },
      'war-complete': {},
      'war-in-progress': {
        on: {
          attack: {
            actions: assign({
              tiles: ({ context, event }) => {
                let { troopCount: tile1TroopCount } =
                  context.tiles[event.tile1];
                let { troopCount: tile2TroopCount } =
                  context.tiles[event.tile2];

                context.tiles[event.tile1] = {
                  ...context.tiles[event.tile1],
                  troopCount: tile1TroopCount - 1,
                };
                context.tiles[event.tile2] = {
                  ...context.tiles[event.tile2],
                  troopCount: tile2TroopCount - 1,
                };

                return context.tiles;
              },
            }),
          },
        },
      },
    },
  });
