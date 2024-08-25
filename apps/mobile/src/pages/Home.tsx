import { newPlanet, PrimaryButton } from '@end/components';
import { Canvas } from '@react-three/fiber/native';
import React, { startTransition, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Hexasphere } from '@end/hexasphere';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';

export default function Home({ navigation }: { navigation: any }) {
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
        newPlanet();
      }),
    []
  );

  return (
    <View style={{ flex: 1 }} {...events}>
      <Canvas camera={cam}>
        <Hexasphere key={reset} />
        <OrbitControls />
      </Canvas>
      <PrimaryButton onPress={np}>New Planet</PrimaryButton>
      <PrimaryButton onPress={() => {}}>Logout</PrimaryButton>
    </View>
  );
}
