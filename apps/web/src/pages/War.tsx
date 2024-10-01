import { H4, View, XStack } from 'tamagui';
import React, {
  ComponentType,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { execute, warDerived, warProxy } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { GameTabs, PortalPath, useResponsive } from '@end/components';
import { Canvas } from '@react-three/fiber';
import { Coords, hexasphere } from '@end/shared';
import { Hexasphere } from '@end/hexasphere';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { War } from '@end/wm/core';
import { MarkerType, Position, ReactFlow, Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { Tile, TurnAction } from '@end/war/core';
import { useSnapshot } from 'valtio';

const initialNodes = [
  {
    id: '1',
    position: { x: 100, y: 0 },
    data: { label: '1' },
  },
  {
    id: '2',
    position: { x: 0, y: 45 },
    data: { label: '2' },
    targetPosition: Position.Right,
  },
  {
    id: '3',
    position: { x: 0, y: 90 },
    data: { label: '3' },
    targetPosition: Position.Right,
  },
  {
    id: '4',
    position: { x: 200, y: 45 },
    data: { label: '4' },
    targetPosition: Position.Left,
  },
  {
    id: '5',
    position: { x: 200, y: 90 },
    data: { label: '5' },
    targetPosition: Position.Left,
  },
  {
    id: '6',
    position: { x: 0, y: 135 },
    data: { label: '6' },
    targetPosition: Position.Right,
  },
  {
    id: '7',
    position: { x: 200, y: 135 },
    data: { label: '7' },
    targetPosition: Position.Left,
  },
  {
    id: '8',
    position: { x: 0, y: 180 },
    data: { label: '8' },
    targetPosition: Position.Right,
  },
];
const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    color: 'white',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-4',
    source: '1',
    target: '4',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-5',
    source: '1',
    target: '5',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-6',
    source: '1',
    target: '6',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-7',
    source: '1',
    target: '7',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
  {
    id: 'e1-8',
    source: '1',
    target: '8',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.Arrow,
    },
  },
];

function AttackDialog({
  owner,
  portalCoords,
  setTerritoryToAttack,
  territoryToAttack,
}: {
  portalCoords?: [Coords?, Coords?];
  owner: number;
  setTerritoryToAttack?: Dispatch<SetStateAction<string | undefined>>;
  territoryToAttack?: string;
}) {
  const derived = useSnapshot(warDerived);

  const nodes = useMemo(() => {
    let nodeId = 1;
    const selectedTile = warProxy.tiles.find(
      (t) => t.id == warProxy.selection.selectedId
    ) ?? { name: '', troopCount: 0, id: '' };
    const n: Record<number, Node & { tileId: string }> = {
      1: {
        ...initialNodes[0],
        tileId: selectedTile.id,
        data: {
          label: (
            <XStack>
              <View
                flex={1}
                style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  marginRight: 10,
                }}
              >
                {selectedTile.name}
              </View>
              <View> / {selectedTile.troopCount}</View>
            </XStack>
          ),
        },
      },
    };

    for (let i = 1; i <= 7; i++) {
      const tiles = Object.keys(derived.selectedNeighborsOwners);
      const tile = warProxy.tiles.find((t) => t.id == tiles[i - 1]);
      const tileOwner = derived.selectedNeighborsOwners[tile?.id ?? -1];

      if (!tile || !tileOwner) {
        continue;
      }
      const base = initialNodes[nodeId];
      nodeId++;

      n[nodeId + 1] = {
        ...base,
        tileId: tile.id,
        selected: tile.id === territoryToAttack,
        data: {
          label: (
            <XStack>
              <View
                flex={1}
                style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  marginRight: 10,
                }}
              >
                {tile.name}
              </View>
              <View> / {tile.troopCount}</View>
            </XStack>
          ),
        },
      };
    }

    const portalCoord = (() => {
      if (!portalCoords) {
        return undefined;
      }
      if (portalCoords[0]) {
        const { x, y, z } = portalCoords[0];
        if (`${x},${y},${z}` === selectedTile.id) {
          const { x: x1, y: y1, z: z1 } = portalCoords[1] ?? {};
          return `${x1},${y1},${z1}`;
        }
      }
      if (portalCoords[1]) {
        const { x, y, z } = portalCoords[1];
        if (`${x},${y},${z}` === selectedTile.id) {
          const { x: x1, y: y1, z: z1 } = portalCoords[0] ?? {};
          return `${x1},${y1},${z1}`;
        }
      }

      return undefined;
    })();

    if (portalCoord) {
      const tile = warProxy.tiles.find((t) => t.id == portalCoord) ?? {
        name: '',
        troopCount: 0,
        id: '',
      };
      n[9] = {
        ...initialNodes[7],
        tileId: portalCoord,
        data: {
          label: (
            <XStack>
              <View
                flex={1}
                style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  marginRight: 10,
                }}
              >
                {tile.name}
              </View>
              <View> / {tile.troopCount}</View>
            </XStack>
          ),
        },
      };
    }

    return n;
  }, [derived.selectedNeighborsOwners, warProxy.selection.selectedId]);

  return (
    <View
      style={{
        height: 220,
        paddingLeft: 10,
      }}
    >
      <ReactFlow
        style={{
          backgroundColor: 'transparent',
          padding: 10,
        }}
        fitViewOptions={{ padding: 10 }}
        viewport={{ zoom: 1, y: 2, x: 2 }}
        autoPanOnNodeDrag={false}
        nodesDraggable={false}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
        panOnDrag={false}
        edgesFocusable={false}
        nodesConnectable={false}
        nodesFocusable={true}
        draggable={false}
        elementsSelectable={true}
        colorMode="dark"
        nodes={Object.values(nodes)}
        edges={initialEdges}
        multiSelectionKeyCode="Meta"
        onNodeClick={(e, node) => {
          const selectedId = node.id;
          if (selectedId !== '1') {
            document.querySelectorAll('.node-selected').forEach((el) => {
              el.classList.remove('node-selected');
            });
            setTimeout(() => {
              document
                .querySelectorAll(`[data-id='${selectedId}']`)[0]
                .classList.add('node-selected');
            }, 0);
            const tile = Object.values(nodes).find((n) => n.id === selectedId);

            if (tile) {
              setTerritoryToAttack?.(tile.tileId);
            }
          }
        }}
      />
    </View>
  );
}

function WarComponent({
  war,
  setTitle: st,
}: {
  war: War;
  setTitle?: (title?: string) => void;
}) {
  const [title, setTitle] = useState('');
  let params = useParams();
  const { services } = useEndApi();
  const { getProxy, getDerived, getColors } = services.hexaService;

  const [raisedTiles, setRaisedTiles] = useState<Set<string>>(new Set());
  const [tileOwners, setTileOwners] = useState<Map<string, number>>(new Map());

  const [portalCoords, setPortalCoords] = useState<[Coords?, Coords?]>();
  const [deployCoords, setDeployCoords] = useState<Coords | undefined>();
  const [selectingPortalEntry, setSelectingPortalEntry] = useState<
    'first' | 'second' | undefined
  >('first');

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params.id) {
      return () => {};
    }

    Promise.all([
      war.planet.fetch(),
      execute(services.conquestService.getWar(params.id)).then((r) => r.json()),
    ]).then(([local, remote]) => {
      const tiles: Record<string, Tile> = JSON.parse(remote.war.state).context
        .tiles;
      const raised: Record<string, string> = JSON.parse(local.raised);
      const owners = new Map();
      getProxy().colors.land = local.landColor;
      getProxy().colors.water = local.waterColor;
      getProxy().tiles.forEach((tile) => {
        if (raised[tile.id]) {
          const name = raised[tile.id];
          const { troopCount, owner } = tiles[tile.id];
          tile.name = name;
          tile.troopCount = troopCount;
          tile.owner = owner;
          tile.raised = true;
          owners.set(tile.id, tile.owner);
        }
      });
      setLoaded(true);

      const title = `The War of ${local.name}`;
      setTitle(title);
      st?.(title);
    });

    services.conquestService.connectToWarLog(params.id).subscribe((r) => {
      // try {
      //   if (r) {
      //     const s = JSON.parse(
      //       JSON.parse(r).updateDescription.updatedFields.state
      //     );
      //
      //     const tile = getProxy().tiles.find((tile) => tile.id === tile1);
      //
      //     if (tile) {
      //       tile.troopCount = s.context.tiles[tile1].troopCount;
      //     }
      //   }
      // } catch (e) {}
    });

    return () => {
      st?.('');
    };
  }, []);
  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);
  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1297) {
      return [[0, 160, 25], {}];
    }

    return [
      [0, 160, 25],
      {
        minWidth: 2000,
        width: '150%',
        marginLeft: -600,
      },
    ];
  }, [width]);

  const [selectedTile, setSelectedTile] = useState<string>();
  const [turnAction, setTurnAction] = useState<TurnAction>('attack');
  const [availableTroops, setAvailableTroopsState] = useState(100);
  const [troopChange, setTroopChange] = useState(0);
  const [territoryToAttack, setTerritoryToAttack] = useState<string>();

  useEffect(() => {
    setTerritoryToAttack(undefined);
  }, [selectedTile]);

  const setAvailableTroops = useCallback(
    (args: any) => {
      const tile = warProxy.tiles.find((tile) => tile.id === selectedTile);
      if (tile) {
        tile.troopCount = (tile.troopCount ?? 0) + troopChange;
      }
      return setAvailableTroopsState(args);
    },
    [setAvailableTroopsState, troopChange, selectedTile]
  );

  const onTileSelection = useCallback(
    (tile: Coords) => {
      setSelectedTile(Object.values(tile).join(','));

      switch (turnAction) {
        case 'portal':
          if (selectingPortalEntry === 'first') {
            setPortalCoords((prev) => {
              prev = [tile, prev?.[1]];
              return prev;
            });
          } else if (selectingPortalEntry === 'second') {
            setPortalCoords((prev) => {
              prev = [prev?.[0], tile];
              return prev;
            });
          }
          break;
        case 'deploy':
          setDeployCoords(tile);
          break;
      }
    },
    [selectingPortalEntry, setPortalCoords, setDeployCoords, turnAction]
  );

  const [menuOpen, setMenuOpen] = useState(true);
  const { bp } = useResponsive(menuOpen);

  const attackTerritories = useMemo(() => {
    if (!selectedTile) {
      return [];
    }
    return hexasphere.tileLookup[selectedTile].neighbors.map((tile) => {
      const { x, y, z } = tile.centerPoint;
      return [x, y, z].join(',');
    });
  }, [selectedTile]);

  const attackTerritory = useCallback(() => {
    if (territoryToAttack) {
      const tile = warProxy.tiles.find((n) => n.id === territoryToAttack);
      if (tile) {
        tile.troopCount = (tile?.troopCount ?? 1) - 1;
      }
      const attackingFrom = warProxy.tiles.find((n) => n.id === selectedTile);
      if (attackingFrom) {
        attackingFrom.troopCount = (attackingFrom?.troopCount ?? 1) - 1;
      }
    }
  }, [territoryToAttack]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View style={bp(['pl-10 flex items-start', 'hidden', 'block'])}>
        <H4>{title}</H4>
        {/*<Badge title={params.id} />*/}
      </View>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <Hexasphere
          derived={getDerived()}
          proxy={getProxy()}
          onTileSelection={onTileSelection}
          selectedTile={selectedTile}
          waterColor={getColors().water}
          landColor={getColors().land}
          showTroopCount={true}
          raisedTiles={raisedTiles}
          showAttackArrows={true}
          tileOwners={tileOwners}
          portalCoords={portalCoords}
          portalPath={PortalPath}
        />
        <OrbitControls />
      </Canvas>
      <GameTabs
        derived={getDerived()}
        menuOpen={menuOpen}
        proxy={getProxy()}
        selectedTile={selectedTile}
        setSelectingPortalEntry={setSelectingPortalEntry}
        selectTile={(tile) => {
          const [x, y, z] = tile.split(',').map((x) => parseFloat(x));
          onTileSelection({ x, y, z });
        }}
        setMenuOpen={setMenuOpen}
        newPlanet={() => {}}
        startGame={() => {}}
        attackDialog={AttackDialog}
        portalCoords={portalCoords}
        setPortalCoords={setPortalCoords}
        deployCoords={deployCoords}
        setDeployCoords={setDeployCoords}
        turnAction={turnAction}
        setTurnAction={setTurnAction}
        availableTroops={availableTroops}
        setAvailableTroops={setAvailableTroops}
        troopChange={troopChange}
        setTroopChange={setTroopChange}
        attackTerritories={attackTerritories}
        attackTerritory={attackTerritory}
        setTerritoryToAttack={setTerritoryToAttack}
        territoryToAttack={territoryToAttack}
      />
    </View>
  );
}

const EnhancedWarComponent = compose(
  withDatabase,
  withObservables(
    ['warId'],
    ({
      database,
      warId,
    }: {
      database: Database;
      warId: string;
    }): { war: Observable<War> } => ({
      war: database.get<War>('wars').findAndObserve(warId),
    })
  ) as (arg0: unknown) => ComponentType
)(WarComponent);

export default function WarRouteComponent() {
  const params = useParams();

  return <EnhancedWarComponent warId={params.id} />;
}
