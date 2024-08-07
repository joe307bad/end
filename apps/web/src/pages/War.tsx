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
import { Badge, PrimaryButton } from '@end/components';
import { Canvas } from '@react-three/fiber';
import { Hexasphere } from '@end/hexasphere';
import { OrbitControls } from '@react-three/drei';
import { View } from 'react-native';
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
  //
  useEffect(() => {
    war.planet.fetch().then((planet: Planet) => {
      setTitle(`The War of ${planet.name}`);
      const raisedTiles = new Set(planet.raised.split('|'));
      console.log(planet);
      getProxy().colors.land = planet.landColor;
      getProxy().colors.water = planet.waterColor;

      getProxy().tiles.forEach((tile) => {
        tile.raised = raisedTiles.has(tile.id);
      });
    });
    if (params.id) {
      execute(services.conquestService.getWar(params.id))
        .then((r) => r.json())
        .then((res) => {
          const tiles = JSON.parse(res.war.state).context.tiles;
          getProxy().tiles.forEach((tile) => {
            if (tiles[tile.id]) {
              tile.troopCount = tiles[tile.id].troopCount;
            }
          });
        });
      services.conquestService.connectToWarLog(params.id).subscribe((r) => {
        try {
          if (r) {
            const s = JSON.parse(
              JSON.parse(r).updateDescription.updatedFields.state
            );
            const raisedTiles = s.context.tiles;
            // console.log('///');
            // console.log({ tiles: s.context.tiles });
            // console.log({ tile1: s.context.tiles[tile1].troopCount });
            // console.log({ tile2: s.context.tiles[tile2].troopCount });

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
      <Canvas style={{ flex: 1 }} camera={cam}>
        <Hexasphere
          derived={getDerived()}
          proxy={getProxy()}
          selectedTile={tile1}
          waterColor={getColors().water}
          landColor={getColors().land}
          showTroopCount={true}
        />
        <OrbitControls />
      </Canvas>
      <PrimaryButton onPress={attack}>Attack</PrimaryButton>
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
