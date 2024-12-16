import { PrimaryButton } from '@end/components';
import { Canvas } from '@react-three/fiber/native';
import React, {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import { useEndApi } from '@end/data/rn';

export default function War() {
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

      }),
    []
  );
  const { services } = useEndApi();
  const cameraPath = useRef<{
    points: THREE.Vector3[];
    tangents: THREE.Vector3[];
  }>();

  return (
    <View style={{ flex: 1 }} {...events}>
      <Canvas camera={cam}>
        <Suspense fallback={null}>
          <OrbitControls />
        </Suspense>
      </Canvas>
      <PrimaryButton onPress={np}>New Planet</PrimaryButton>
      <PrimaryButton onPress={() => {}}>Logout</PrimaryButton>
    </View>
  );
}
