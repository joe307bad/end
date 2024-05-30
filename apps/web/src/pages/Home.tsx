import { Home as H, TabsContainer } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions, View } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { getRandomName, Hexasphere, hexasphereProxy } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import { H2 } from 'tamagui';
// @ts-ignore
import v from 'voca';
import { useEndApi } from '@end/data';

export default function Home() {
  const ref = useRef(null);

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
    setReset(Math.random());
  }, []);

  const name = useMemo(() => {
    return getRandomName();
  }, [reset]);

  const { EndApi } = useEndApi();

  const startGame = useCallback(() => {
    debugger;
    EndApi.startWar(
      {
        landColor: '',
        raised: '',
        waterColor: '',
        name: Math.random().toString(),
      },
      5
    );
  }, []);

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <View style={{ overflow: 'hidden', height: "100%", width: "100%" }}>
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
    </H>
  );
}
