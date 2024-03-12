import { Home as H, Planet, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';

export default function Home() {
  const [seed, setSeed] = useState(Math.random());
  const { width } = useWindowDimensions();

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Canvas
        style={{ flex: 1, width: '100%' }}
        camera={{ position: [0, width < 600 ? 300 : 160, 25], fov: 45 }}
      >
        <OrbitControls />
        <Planet seed={seed} />
      </Canvas>
      <PrimaryButton onPress={() => setSeed(Math.random())}>New Planet</PrimaryButton>
    </H>
  );
}
