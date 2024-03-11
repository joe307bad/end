import { Home as H } from '@end/components';
import { database, sync } from '@end/wm/web';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';
import { Hexasphere } from '@end/hexasphere';

export default function Home() {
  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [0, 160, 25], fov: 45 }}
      >
        <OrbitControls />
        <Hexasphere />
      </Canvas>
    </H>
  );
}
