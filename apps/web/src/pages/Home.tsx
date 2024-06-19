import { Home as H, TabsContainer } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions, View } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { getRandomName, Hexasphere, hexasphereProxy } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import { H2 } from 'tamagui';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { useNavigate } from 'react-router-dom';
import { Effect, pipe } from 'effect';

export default function Home() {
  const { width } = useWindowDimensions();
  const navigate = useNavigate();

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

  const [selectedTile, selectTile] = useState<string>();
  const [reset, setReset] = useState(Math.random());

  const newPlanet = useCallback(() => {
    hexasphereProxy.tiles.forEach((tile) => {
      const raisedness = faker.number.float({ min: 0.1, max: 0.9 });

      tile.name = getRandomName();
      tile.raised = faker.datatype.boolean(raisedness);
      tile.selected = false;
      tile.defending = false;
    });
    hexasphereProxy.selection.selectedId = null;
    hexasphereProxy.selection.cameraPosition = null;
    hexasphereProxy.colors.land = faker.color.rgb({ format: 'hex' });
    hexasphereProxy.colors.water = faker.color.rgb({ format: 'hex' });
    setReset(Math.random());
  }, []);

  const name = useMemo(() => {
    return getRandomName();
  }, [reset]);

  const { services } = useEndApi();

  const startGame = useCallback(
    async function () {
      const raised = hexasphereProxy.tiles
        .filter((tile) => tile.raised)
        .map((tile) => {
          return tile.id;
        })
        .join('|');

      await execute(
        pipe(
          services.conquestService.startWar(
            {
              landColor: hexasphereProxy.colors.land,
              waterColor: hexasphereProxy.colors.water,
              raised,
              name,
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
    [name]
  );

  return (
    // <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <H2 paddingLeft="$1">{name}</H2>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <Hexasphere key={reset} selectedTile={selectedTile} />
        <OrbitControls />
      </Canvas>
      <TabsContainer
        menuOpen={true}
        selectTile={selectTile}
        newPlanet={newPlanet}
        startGame={startGame}
      />
    </View>
    // </H>
  );
}
