// @ts-ignore
import HS from './hexasphere.lib';
import * as THREE from 'three';
import { NormalBufferAttributes } from 'three';

type Face = {
  id: number;
  centroid: Coords;
  points: ({ faces: Face[] } & Coords)[];
};

type LandAndWater = {
  land: { positions: Float32Array; indices: Uint16Array };
  water: { positions: Float32Array; indices: Uint16Array };
  landGeometry: THREE.BufferGeometry<NormalBufferAttributes>;
};

export type Tile = {
  id: string;
  boundary: Coords[];
  centerPoint: { faces: Face[] } & Coords;
  faces: Face[];
  neighborIds: string[];
  neighbors: Tile[];
  raised?: boolean;
  owner?: number;
  selected: boolean;
  defending?: boolean;
  name?: string;
  troopCount?: number;
} & LandAndWater;

export type THexasphere = {
  radius: number;
  tiles: Tile[];
  tileLookup: Record<string, Tile>;
};

export type Coords = {
  x: number;
  y: number;
  z: number;
};

export const hexasphere: THexasphere = new HS(50, 4, 1);
