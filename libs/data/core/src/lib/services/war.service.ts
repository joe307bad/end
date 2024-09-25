import { proxy } from 'valtio';
import { Context, Effect, Layer, pipe, Option as O } from 'effect';
import type { Option } from 'effect/Option';
import * as THREE from 'three';

type Tile = {
  id: string;
  selected: boolean;
  defending: boolean;
  raised: boolean;
  name: string;
  troopCount: number;
  owner: number;
};

interface WarStore {
  name: Option<string>;
  selectedTileId: Option<string>;
  cameraPosition: Option<THREE.Vector3>;
  waterColor: Option<string>;
  landColor: Option<string>;
  tiles: Tile[];
  sort: 'most-troops' | 'least-troops' | 'alphabetical';
  filter: 'all' | 'mine' | 'opponents' | 'bordering';
}

const store = proxy<WarStore>({
  cameraPosition: O.none(),
  filter: 'all',
  landColor: O.none(),
  selectedTileId: O.none(),
  sort: 'alphabetical',
  tiles: [],
  waterColor: O.none(),
  name: O.none(),
});

interface IWarService {
  store: WarStore;
}

const WarService = Context.GenericTag<IWarService>('war-service');

const WarLive = Layer.effect(
  WarService,
  Effect.gen(function* () {
    return WarService.of({
      store,
      selectTile() {

      },

    });
  })
);

const WarPipe = pipe(WarLive);

export { WarService, WarPipe, IWarService };
