import { Home as H, newPlanet, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/rn';
import { Canvas } from '@react-three/fiber/native';
import React, { startTransition, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Hexasphere } from '@end/hexasphere';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';

export default function Home({ logOut }: { logOut: () => void }) {
  const [OrbitControls, events] = useControls();
  const [reset, setReset] = useState(Math.random());
  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 250);

    return cam;
  }, []);

  const np = useCallback(
    () =>
      startTransition(() => {
        newPlanet(setReset);
      }),
    []
  );

  return (
    <View style={{ flex: 1 }} {...events}>
      <H
        database={database}
        sync={sync}
        apiUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}
      >
        <Canvas frameloop="demand" renderToHardwareTextureAndroid={true} camera={cam}>
          <Hexasphere key={reset} />
          <OrbitControls />
        </Canvas>
      </H>
      <PrimaryButton onPress={np}>New Planet</PrimaryButton>
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </View>
  );
}
