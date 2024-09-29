import { H4, View, XStack } from 'tamagui';
import { useEndApi } from '@end/data/web';
import React, {
  ComponentType,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSnapshot } from 'valtio/react';
import { Coords, hv2, selectTile, Tile } from '@end/hexasphere';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PortalPath, useResponsive } from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';
import { getOrUndefined } from 'effect/Option';
import { execute, warDerived, warProxy } from '@end/data/core';
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
import { tileIdAndCoords } from '../../../../libs/data/core/src/lib/services/war.service';
import { GameTabsV2 } from '../../../../libs/ui/rnw/src/lib/Tabs/GameTabs_v2';

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
  setTerritoryToAttack: (coords: Coords) => void;
  territoryToAttack: Option<Coords>;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const tileOwners = useSnapshot(warService.derived.selectedNeighborsOwners);

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
      const tiles = Object.keys(tileOwners);
      const tile = warProxy.tiles.find((t) => t.id == tiles[i - 1]);
      const tileOwner = tileOwners[tile?.id ?? -1];

      if (!tile || !tileOwner) {
        continue;
      }
      const base = initialNodes[nodeId];
      nodeId++;

      n[nodeId + 1] = {
        ...base,
        tileId: tile.id,
        selected:
          tile.id === tileIdAndCoords(getOrUndefined(territoryToAttack))[0],
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
  }, [tileOwners, warProxy.selection.selectedId]);

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
              setTerritoryToAttack(tileIdAndCoords(tile.tileId)[1]);
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
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
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
      const tiles: Record<string, any> = JSON.parse(remote.war.state).context
        .tiles;
      const raised: Record<string, string> = JSON.parse(local.raised);
      const owners = new Map();
      warService.setLandAndWaterColors(local.waterColor, local.landColor);
      warService.setTiles(raised, tiles);
      setLoaded(true);

      const title = `The War of ${local.name}`;
      warService.setName(title);
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
      warService.onTileSelection(null);
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
        selectTile={setSelectedTile}
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
