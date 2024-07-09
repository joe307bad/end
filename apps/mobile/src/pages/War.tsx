import { newPlanet, PrimaryButton } from '@end/components';
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
import { Hexasphere } from '@end/hexasphere';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import { useEndApi } from '@end/data/rn';
import { useFocusEffect } from '@react-navigation/native';
import { subscribeKey } from 'valtio/utils';

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
        newPlanet(setReset);
      }),
    []
  );
  const { services } = useEndApi();
  const { getProxy, getDerived, getColors } = services.hexaService;
  const cameraPath = useRef<{
    points: THREE.Vector3[];
    tangents: THREE.Vector3[];
  }>();

  useFocusEffect(() => {
    const unsubscribe = subscribeKey(getDerived(), 'cameraPath', (s) => {
      cameraPath.current = s;
    });

    return () => unsubscribe();
  });

  return (
    <View style={{ flex: 1 }} {...events}>
      <Canvas camera={cam}>
        <Suspense fallback={null}>
          <Hexasphere
            key={reset}
            proxy={getProxy()}
            selectedTile="0,50,0"
            waterColor={getColors().water}
            landColor={getColors().land}
            showTroopCount={true}
          />
          <OrbitControls />
        </Suspense>
      </Canvas>
      <PrimaryButton onPress={np}>New Planet</PrimaryButton>
      <PrimaryButton onPress={() => {}}>Logout</PrimaryButton>
    </View>
  );
}
