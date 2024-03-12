import { Home as H, Planet, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/rn';
import { Canvas } from '@react-three/fiber/native';
import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';

export default function Home({ logOut }: { logOut: () => void }) {
  const [seed, setSeed] = useState(Math.random());
  const { width } = useWindowDimensions();
  const [OrbitControls, events] = useControls();

  return (
    <>
      <H
        database={database}
        sync={sync}
        apiUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}
      >
        <View style={{flex: 1}} {...events}>
          <Canvas
            style={{ flex: 1, width: '100%' }}
            camera={{ position: [0, width < 600 ? 300 : 160, 25], fov: 45 }}
          >
            <OrbitControls />
            <Planet seed={seed} />
          </Canvas>
          <PrimaryButton onPress={() => setSeed(Math.random())}>New Planet</PrimaryButton>
        </View>
      </H>
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </>
  );
}
