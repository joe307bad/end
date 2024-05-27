import { TabsContainer, Home as H, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { Hexasphere, hexasphereProxy } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import { Header } from 'tamagui';

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

    if (width < 835) {
      cam.position.set(0, 0, 300);
    } else {
      cam.position.set(0, 0, 160);
    }

    return cam;
  }, []);

  const [selectedTile, selectTile] = useState<string>();
  const [reset, setReset] = useState(Math.random());

  const newPlanet = useCallback(() => {
    hexasphereProxy.tiles.forEach((tile) => {
      // TODO is there a way to completed destroy and recreate the proxy + the hexasphere? This may resolve perf issues
      const raisedness = faker.number.float({ min: 0.1, max: 0.9 });
      const name = faker.lorem.word();
      tile.name = name;
      tile.raised = faker.datatype.boolean(raisedness);
      tile.selected = false;
      tile.defending = false;
    });
    hexasphereProxy.selection.selectedId = null;
    hexasphereProxy.selection.cameraPosition = null;
    setReset(Math.random());
  }, []);

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Header>Galator IV</Header>
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
      />
    </H>
  );
}
