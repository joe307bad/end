import React from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import {
  Lights,
  Planet,
  Providers,
  SolarSystem,
  Sun,
  SystemDetails,
} from '@end/components';
import './app.module.less';
import { OrbitControls } from '@react-three/drei';

function System() {
  return (
    <>
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
    </>
  );
}

export function App() {
  return (
    <View style={{ height: '100%' }}>
      <Providers>
        <SystemDetails>
          <System />
        </SystemDetails>
      </Providers>
    </View>
  );
}

export default App;
