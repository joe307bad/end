import {
  Home as H,
  PrimaryButton,
} from '@end/components';
import { database, sync } from '@end/wm/rn';
import { Canvas } from '@react-three/fiber/native';
import React from 'react';
import { View } from 'react-native';
import { Hexasphere } from '@end/hexasphere';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';

const cam = new THREE.PerspectiveCamera(45);
cam.position.set(0, 0, 160);

export default function Home({ logOut }: { logOut: () => void }) {
  const [OrbitControls, events] = useControls();

  return (
    <View style={{ flex: 1 }} {...events}>
      <H
        database={database}
        sync={sync}
        apiUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}
      >
        <Canvas camera={cam}>
          <Hexasphere />
          <OrbitControls />
        </Canvas>
      </H>
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </View>
  );
}
