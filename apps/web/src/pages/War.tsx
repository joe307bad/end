import { H4, View, XStack, Text } from 'tamagui';
import { useEndApi } from '@end/data/web';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { hv2 } from '@end/hexasphere';
import { Coords } from '@end/shared';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PortalPath, useResponsive, GameTabsV2 } from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';
import { Option as O } from 'effect';
import { getOrUndefined } from 'effect/Option';
import { execute } from '@end/data/core';
import { useParams } from 'react-router-dom';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { War } from '@end/wm/core';
import { MarkerType, Node, Position, ReactFlow } from '@xyflow/react';
import { Option } from 'effect/Option';
import '@xyflow/react/dist/style.css';

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
  portalCoords,
  setTerritoryToAttack,
  territoryToAttack,
}: {
  portalCoords?: [Coords?, Coords?];
  setTerritoryToAttack: (coords: Coords) => void;
  territoryToAttack: Option<Coords>;
}) {
  const { services } = useEndApi();
  const { warService, endApi } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  const [selectedTileId] = warService.tileIdAndCoords(
    getOrUndefined(warStore.selectedTileId)
  );

  const nodes = useMemo(() => {
    let nodeId = 1;
    const selectedTile = warStore.tiles.find((t) => t.id == selectedTileId) ?? {
      name: '',
      troopCount: 0,
      id: '',
    };
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
                <Text>{selectedTile.name}</Text>
              </View>
              <Text whiteSpace="nowrap">/ {selectedTile.troopCount}</Text>
            </XStack>
          ),
        },
      },
    };

    for (let i = 1; i <= 7; i++) {
      const tiles = Object.keys(warDerived.selectedNeighborsOwners);
      const tile = warStore.tiles.find((t) => t.id == tiles[i - 1]);
      const tileOwner: string | undefined = (warDerived.selectedNeighborsOwners[tile?.id ?? -1] ?? {}).owner;

      if (!tile || !tileOwner) {
        continue;
      }
      const base = initialNodes[nodeId];
      nodeId++;

      n[nodeId + 1] = {
        ...base,
        tileId: tile.id,
        selected:
          tile.id ===
          warService.tileIdAndCoords(getOrUndefined(territoryToAttack))[0],
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
                <Text>{tile.name}</Text>
              </View>
              <Text whiteSpace="nowrap">/ {tile.troopCount}</Text>
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
      const tile = warStore.tiles.find((t) => t.id == portalCoord) ?? {
        name: '',
        troopCount: 0,
        id: '',
      };

      if (tile?.troopCount === 0) {
        return n;
      }

      n[9] = {
        ...initialNodes[7],
        tileId: portalCoord,
        data: {
          label: (
            <XStack>
              <Text
                flex={1}
                style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  marginRight: 10,
                }}
              >
                {tile.name}
              </Text>
              <Text whiteSpace="nowrap">/ {tile.troopCount}</Text>
            </XStack>
          ),
        },
      };
    }

    return n;
  }, [warDerived.selectedNeighborsOwners, warStore.selectedTileId]);

  return (
    <View
      style={{
        height: 140,
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
              setTerritoryToAttack(warService.tileIdAndCoords(tile.tileId)[1]);
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
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);
  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1000) {
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

  const [_selectedTile, setSelectedTile] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(true);
  let params = useParams();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params.id) {
      return () => {};
    }

    Promise.all([
      war.planet.fetch(),
      execute(services.conquestService.getWar(params.id)).then((r) => r.json()),
    ]).then(([local, remote]) => {
      const war = JSON.parse(remote.war.state);
      const players = war.context.players;
      const portal = war.context.portal;
      const state = war.value;
      const turn = war.context.turn;
      const round = remote.round;
      const battles = war.context.turns[war.context.turn]?.battles ?? [];
      const battleLimit = war.context.battleLimit;
      const availableTroopsToDeploy = remote.availableTroopsToDeploy;

      const tiles: Record<string, any> = war.context.tiles;
      const raised: Record<string, string> = JSON.parse(local.raised);
      setLoaded(true);

      const title = `The War of ${local.name}`;
      st?.(title);

      warService.begin(
        params.id ? O.some(params.id) : O.none(),
        state,
        raised,
        tiles,
        local.waterColor,
        local.landColor,
        players,
        portal,
        turn,
        round,
        battles,
        battleLimit,
        availableTroopsToDeploy
      );
      warService.setName(title);
    });

    const unsubscribe = services.conquestService.connectToWarLog(
      params.id,
      (r) => execute(services.warService.handleWarLogEntry(r))
    );

    return () => {
      warService.onTileSelection(null).then(async (settingPortal) => {
        if (settingPortal) {
          await execute(conquestService.setPortal());
        }
      });
      warService.setActiveBattle(undefined);
      unsubscribe();
    };
  }, []);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);
  const { bp } = useResponsive(menuOpen);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View style={bp(['pl-10 flex items-start', 'hidden', 'block'])}>
        <H4>{getOrUndefined(warStore.name)}</H4>
        {/*<Badge title={params.id} />*/}
      </View>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <hv2.HexasphereV2 portalPath={PortalPath} />
        <OrbitControls />
      </Canvas>
      <GameTabsV2
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        attackDialog={AttackDialog}
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
