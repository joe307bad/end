// @ts-ignore
import HS from './hexasphere.lib';
import * as THREE from 'three';
import { NormalBufferAttributes } from 'three';
import { faker } from '@faker-js/faker';
// @ts-ignore
import v from 'voca';

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

export function convertToRoman(num: number) {
  var roman = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  var str = '';

  for (var i of Object.keys(roman)) {
    // @ts-ignore
    var q = Math.floor(num / roman[i]);
    // @ts-ignore
    num -= q * roman[i];
    str += i.repeat(q);
  }

  return str;
}

export const getRandomName = () => {
  const words = [
    faker.lorem.word(),
    faker.word.noun(),
    faker.person.lastName(),
    faker.science.chemicalElement().name,
  ];
  const word1 = words[faker.number.int({ min: 0, max: words.length - 1 })];

  function findWord2() {
    const word2 = words[faker.number.int({ min: 0, max: words.length - 1 })];
    if (word2 === word1) {
      return findWord2();
    }

    return word2;
  }

  function addRomanNumeral() {
    const show = faker.datatype.boolean();

    if (!show) {
      return '';
    }

    return ` ${convertToRoman(faker.number.int({ min: 1, max: 10 }))}`;
  }

  return v.titleCase(`${word1} ${findWord2()}`) + addRomanNumeral();
};

export const hexasphere: THexasphere = new HS(50, 4, 1);

export const colors: string[] = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#520043', // Cyan
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#008080', // Teal
  '#800000', // Maroon
  '#40E0D0', // Turquoise
  '#8B4513', // Saddle Brown
];
