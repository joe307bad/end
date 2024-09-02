import { Model, Relation } from '@nozbe/watermelondb';
import { IPlanet } from './Planet';

export interface IWar {
  players: number;
  planet: Relation<Model & IPlanet>;
}

export type TurnAction =
  | 'portal'
  | 'deploy'
  | 'attack'
  | 'reenforce'
  | undefined
  | string;
