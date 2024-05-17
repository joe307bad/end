import { getPointInBetweenByPerc, Home as H, PrimaryButton, tw } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { hexasphere, Hexasphere } from '@end/hexasphere';
import { TabsContainer } from '../../../../libs/ui/rnw/src/lib/Tabs/Tabs';
import { Section } from 'tamagui';

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

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
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
      <TabsContainer menuOpen={true} selectTile={selectTile} />
      <PrimaryButton onPress={() => setReset(Math.random())}>
        New Planet
      </PrimaryButton>
    </H>
  );
}
