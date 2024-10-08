import React, { useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions, View } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { H2 } from 'tamagui';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { useNavigate } from 'react-router-dom';
import { Effect, pipe } from 'effect';
import { useSnapshot } from 'valtio/react';
import { Option as O } from 'effect';
import { getOrUndefined } from 'effect/Option';
import { hv2 } from '@end/hexasphere';
import { TabsContainer } from '@end/components';

export default function Home() {
  const { width } = useWindowDimensions();
  const navigate = useNavigate();
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);

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
  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);

  useEffect(() => {
    warService.initializeMap();
  }, []);

  const startGame = useCallback(
    async function () {
      const raised = warStore.tiles
        .filter((tile) => tile.raised)
        .reduce((acc: Record<string, string>, curr) => {
          acc[curr.id] = curr.name ?? '';
          return acc;
        }, {});

      const combined = O.all([
        warStore.landColor,
        warStore.waterColor,
        warStore.name,
      ]);

      console.log({ combined });
      console.log([warStore.landColor, warStore.waterColor, warStore.name]);

      await O.match(combined, {
        onNone() {
          return null;
        },
        async onSome([land, water, name]) {
          await execute(
            pipe(
              services.conquestService.startWar(
                {
                  landColor: land,
                  waterColor: water,
                  raised: JSON.stringify(raised),
                  name: name,
                },
                5
              ),
              Effect.andThen((response) =>
                services.syncService.sync().pipe(Effect.map(() => response))
              ),
              Effect.andThen((response) => navigate(`/war/${response.warId}`))
            )
          );
        },
      });
    },
    [warStore.landColor, warStore.waterColor, warStore.name]
  );

  return (
    // <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <H2 paddingLeft="$1">{getOrUndefined(warStore.name)}</H2>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <hv2.HexasphereV2 portalPath={undefined} />
        <OrbitControls />
      </Canvas>
      <TabsContainer
        menuOpen={true}
        newPlanet={() => warService.initializeMap()}
        startGame={startGame}
      />
    </View>
    // </H>
  );
}
