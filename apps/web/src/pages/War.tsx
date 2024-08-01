import { H2 } from 'tamagui';
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
import {
  Badge,
  GameTabs,
  newPlanet,
  PrimaryButton,
  TabsContainer,
} from '@end/components';
import { Canvas } from '@react-three/fiber';
import { Hexasphere } from '@end/hexasphere';
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

const tile1 = '0,50,0';
const tile2 = '0,-50,0';

function WarComponent({ war }: { war: War }) {
  const [title, setTitle] = useState('');
  let params = useParams();
  const { services } = useEndApi();
  const { getProxy, getDerived, getColors } = services.hexaService;

  const attack = useCallback(() => {
    if (!params.id) {
      return;
    }

    return execute(
      services.conquestService.attack({ tile1, tile2, warId: params.id })
    );
  }, []);

  const [raisedTiles, setRaisedTiles] = useState<Set<string>>(new Set());
  const [tileOwners, setTileOwners] = useState<Map<string, number>>(new Map());

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

    // setInterval(() => {
    //   if (params.id) {
    //     services.conquestService.createWarLogEvent(params.id);
    //   }
    // }, 1000);
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

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <H2 paddingLeft="$1">{title}</H2>
        <Badge styles="pl-10" title={params.id} />
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
          selectedTile={selectedTile}
          waterColor={getColors().water}
          landColor={getColors().land}
          showTroopCount={true}
          raisedTiles={raisedTiles}
          showAttackArrows={true}
          tileOwners={tileOwners}
        />
        <OrbitControls />
      </Canvas>
      <GameTabs
        menuOpen={true}
        proxy={getProxy()}
        selectTile={setSelectedTile}
        newPlanet={() => {}}
        startGame={() => {}}
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
