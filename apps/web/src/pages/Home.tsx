import { Home as H, Lights, Planet, SolarSystem, Sun } from '@end/components';
import { database, sync } from '@end/wm/web';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';

export default function Home() {
  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Canvas
        style={{ height: '100%' }}
        camera={{ position: [0, 20, 25], fov: 45 }}
      >
        <SolarSystem>
          <Sun />
          <Planet />
          <Lights />
          <OrbitControls />
        </SolarSystem>
      </Canvas>
    </H>
  );
}
