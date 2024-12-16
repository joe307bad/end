import { Effect,pipe} from 'effect';
import * as THREE from 'three';
import {
  Coords,
} from '@end/shared';
import { WarState } from '@end/war/core';
import { WarLive } from './war/WarLive';
import { Players, Result, Tile } from './war/WarSchema';
import { WarStore, derived } from './war/WarStore';
import { tileIdAndCoords } from './war/WarUtils';
import { WarService } from './war/WarService';
import { Planet } from '@end/wm/core';

interface IWarService {
  begin: (local: Planet, remote: any, params: any, title: string) => void;
  setPlayers: (players: Players) => void;
  store: WarStore;
  derived: typeof derived;
  tileIdAndCoords: typeof tileIdAndCoords;
  setWarState: (stage: WarState) => void;
  hasPortal: () => boolean;
  setSelectedTileIdOverride: (coords: string | Coords) => void;
  onTileSelection: (
    tile: string | Coords | null,
    cameraPosition?: THREE.Vector3
  ) => Promise<boolean>;
  setFilter: (filter: WarStore['filter']) => void;
  setLandAndWaterColors: (water: string, land: string) => void;
  setName: (name: string) => void;
  setDeployments: (deployments: { deployTo: string; troopsToDeploy: number; date: string }[]) => void;
  setTiles: (
    raisedTiles: Record<string, string>,
    ownedTiles: Record<string, Tile>
  ) => void;
  setSort: (sort: WarStore['sort']) => void;
  setSettingPortalCoords: (
    settingPortalCords: WarStore['settingPortalCoords']
  ) => void;
  onPortalSetWebSocket: (coords: [Coords?, Coords?]) => void;
  setPortal: (coords: string | Coords) => Promise<true>;
  setDeployTo: (coords?: string | Coords) => void;
  setTurnAction: (action?: WarStore['turnAction'] | undefined) => void;
  setAvailableTroopsToDeploy: (availableTroopsToDeploy: number) => void;
  setTroopsToDeploy: (troopsToDeploy: number) => void;
  setTerritoryToAttack: (coords: Coords) => void;
  attackTerritory: () => Effect.Effect<string, string>;
  deployToTerritory: (tileId?: string, troopsCount?: number) => void;
  initializeMap: () => void;
  parseWarLogEntry: (entry: any) => Effect.Effect<Result, string>;
  handleWarLogEntry: (entry: any) => Effect.Effect<string, string>;
  setCurrentUserTurn: (userId: string) => void;
  setRound: (round: number) => void;
  setUserId: (userId: string) => void;
  setActiveBattle: (battleId?: string) => void;
  setRoundLimit: (roundLimit: string) => void;
  setPlayerLimit: (playerLimit: string) => void;
  setBattleLimit: (battleLimit: string) => void;
  setInactive: () => void;
}

const WarLivePipe = pipe(WarLive);

export { WarService, WarLivePipe, IWarService };
