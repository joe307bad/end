import { H4 } from 'tamagui';
import React, {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { Badge, GameTabs, PortalPath } from '@end/components';
import { Canvas } from '@react-three/fiber';
import { Coords, hexasphere, Hexasphere } from '@end/hexasphere';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions, View } from 'react-native';
import * as THREE from 'three';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { Planet, War } from '@end/wm/core';
import { MarkerType, Position, ReactFlow } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { subscribeKey } from 'valtio/utils';

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
];

function AttackDialog() {
  return (
    <View
      style={{
        height: 160,
        padding: 10,
      }}
    >
      <ReactFlow
        style={{
          backgroundColor: 'transparent',
          padding: 10,
          top: 10,
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
        nodes={initialNodes}
        edges={initialEdges}
      />
    </View>
  );
}

const tile1 = '0,50,0';

function WarComponent({ war }: { war: War }) {
  const [title, setTitle] = useState('');
  let params = useParams();
  const { services } = useEndApi();
  const { getProxy, getDerived, getColors } = services.hexaService;

  const selectFirstTerritory = useCallback((id: string) => {
    if (!params.id) {
      return;
    }

    return execute(
      services.conquestService.selectFirstTerritory({ id, warId: params.id })
    );
  }, []);

  const [raisedTiles, setRaisedTiles] = useState<Set<string>>(new Set());
  const [tileOwners, setTileOwners] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribeKey(
      getDerived(),
      'selectedTileIndex',
      (selectedTileIndex) => {
        const territory = Object.values(hexasphere.tileLookup)[
          selectedTileIndex
        ];

        if (territory?.centerPoint) {
          const { x, y, z } = territory.centerPoint;
          const id = `${x},${y},${z}`;
          selectFirstTerritory(id);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    war.planet.fetch().then((planet: Planet) => {
      setTitle(`The War of ${planet.name}`);
      const raisedTiles = new Set(planet.raised.split('|'));

      getProxy().colors.land = planet.landColor;
      getProxy().colors.water = planet.waterColor;

      getProxy().tiles.forEach((tile) => {
        tile.raised = raisedTiles.has(tile.id);
      });
      setRaisedTiles(raisedTiles);
    });
    if (params.id) {
      execute(services.conquestService.getWar(params.id))
        .then((r) => r.json())
        .then((res) => {
          const tiles = JSON.parse(res.war.state).context.tiles;
          const owners = new Map();
          getProxy().tiles.forEach((tile) => {
            if (tiles[tile.id]) {
              tile.troopCount = tiles[tile.id].troopCount;
              tile.owner = parseInt(tiles[tile.id].owner);
              owners.set(tile.id, tiles[tile.id].owner);
            }
          });
          setTileOwners(owners);
        });
      services.conquestService.connectToWarLog(params.id).subscribe((r) => {
        try {
          if (r) {
            const s = JSON.parse(
              JSON.parse(r).updateDescription.updatedFields.state
            );

            const tile = getProxy().tiles.find((tile) => tile.id === tile1);

            if (tile) {
              tile.troopCount = s.context.tiles[tile1].troopCount;
            }
          }
        } catch (e) {}
      });
    }
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

  const [selectedTile, setSelectedTile] = useState(tile1);
  const [menuOpen, setMenuOpen] = useState(true);
  const [portalCoords, setPortalCoords] = useState<[Coords?, Coords?]>();
  const [selectingPortalEntry, setSelectingPortalEntry] = useState<
    'first' | 'second' | undefined
  >('first');

  const onTileSelection = useCallback(
    (tile: Coords) => {
      debugger;
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
    },
    [selectingPortalEntry, setPortalCoords]
  );

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View
        style={{
          paddingLeft: 10,
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <H4>{title}</H4>
        <Badge title={params.id} />
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
        menuOpen={menuOpen}
        proxy={getProxy()}
        setSelectingPortalEntry={setSelectingPortalEntry}
        selectTile={(tile) => {
          setSelectedTile(tile);
          selectFirstTerritory(tile);
        }}
        setMenuOpen={setMenuOpen}
        newPlanet={() => {}}
        startGame={() => {}}
        attackDialog={AttackDialog}
        portalCoords={portalCoords}
        setPortalCoords={setPortalCoords}
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
