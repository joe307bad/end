import { PrimaryButton } from '@end/components';
import { Canvas } from '@react-three/fiber/native';
import React, { startTransition, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
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

  return (
    <View style={{ flex: 1 }} {...events}>
      <Canvas camera={cam}>
        <OrbitControls />
      </Canvas>
      <PrimaryButton onPress={() => {}}>Logout</PrimaryButton>
    </View>
  );
}
