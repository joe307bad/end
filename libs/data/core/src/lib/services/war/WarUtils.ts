import { Tile } from './WarSchema';
import { Coords, hexasphere } from '@end/shared';
import * as THREE from 'three';
import { store } from './WarStore';
import { Option as O } from 'effect';

export function sortedTilesList(
  tiles: Tile[],
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string,
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string,
  userId: string
) {
  return [...tiles]
    .sort((a, b) => {
      switch (sort) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'least-troops':
          return a.troopCount - b.troopCount;
        case 'most-troops':
          return b.troopCount - a.troopCount;
      }

      return 0;
    })
    .filter((t) => {
      if (!t.raised) {
        return false;
      }

      switch (filter) {
        case 'all':
          return true;
        case 'mine':
          return t.owner === userId;
        case 'opponents':
          return t.owner !== userId;
      }

      return true;
    });
}

export function tileIdAndCoords(
  tile: string | Coords | undefined
): [string, Coords] {
  if (!tile) {
    return ['', { x: 0, y: 0, z: 0 }];
  }

  if (isCoords(tile)) {
    return [`${tile.x},${tile.y},${tile.z}`, tile];
  } else {
    const [x, y, z] = tile.split(',').map((x) => parseFloat(x));
    return [tile, { x, y, z }];
  }
}

export function isCoords(value: string | Coords): value is Coords {
  return (
    (value as Coords).x !== undefined &&
    (value as Coords).y !== undefined &&
    (value as Coords).z !== undefined
  );
}

export function selectTile(id: string, cameraPosition: THREE.Vector3) {
  const currentlySelected = store.tiles.find((tile) => tile.selected);
  if (currentlySelected) {
    currentlySelected.selected = false;
  }

  const newSelected = store.tiles.find((tile) => tile.id === id);

  if (newSelected) {
    newSelected.selected = true;
    store.selectedTileId = O.some(newSelected.id);
    store.cameraPosition = O.some(cameraPosition);

    // These loops were a perf bottleneck
    // I don't even think "defending" is being used
    // const currentlyDefending = store.tiles.filter((tile) => tile.defending);

    // if (currentlyDefending.length > 0) {
      // currentlyDefending.forEach((tile) => {
      //   tile.defending = false;
      // });
    // }

    const neighbors = hexasphere.tileLookup[newSelected.id].neighborIds;

    // newSelected.raised &&
    // // TODO this foreach is prob a perf bottleneck
    //   neighbors.forEach((neighborTileId) => {
    //     const neighbor = store.tiles.find((tile) => tile.id === neighborTileId);
    //     if (neighbor) {
    //       neighbor.defending = true;
    //     }
    //   });
  }

  return currentlySelected;
}
