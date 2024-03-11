import { Home as H, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/web';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useState } from 'react';
import { Hexasphere } from '@end/hexasphere';

export default function Home() {
  const [seed, setSeed] = useState(Math.random());
  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Canvas
        style={{ flex: 1, width: '100%' }}
        camera={{ position: [0, 160, 25], fov: 45 }}
      >
        <OrbitControls />
        <Hexasphere key={seed} />
      </Canvas>
      <PrimaryButton onPress={() => setSeed(Math.random())}>New Planet</PrimaryButton>
    </H>
  );
}
