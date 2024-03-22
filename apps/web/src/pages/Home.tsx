import { Home as H, Planet, tw } from '@end/components';
import { database, sync } from '@end/wm/web';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions, View } from 'react-native';
import { OrbitControls } from '@react-three/drei';

export default function Home() {
  const { width } = useWindowDimensions();

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Planet>
        {(hexasphere: JSX.Element, controls: JSX.Element, footer) => (
          <>
            {controls}
            <Canvas
              style={{
                flex: 1,
                minWidth: 2000,
                width: '150%',
                marginLeft: -600,
              }}
              camera={{ position: [0, width < 600 ? 300 : 160, 25], fov: 45 }}
            >
              <OrbitControls />
              {hexasphere}
            </Canvas>
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
