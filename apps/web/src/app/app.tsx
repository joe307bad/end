import React from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { HeyThere } from '@end/components';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';

export function App() {
  return (
    <View>
      <Canvas>
        <HeyThere>
          <OrbitControls />
          {/* @ts-ignore */}
          <OrthographicCamera
            makeDefault
            zoom={50}
            top={200}
            bottom={-200}
            left={200}
            right={-200}
            near={1}
            far={2000}
            position={[0, 0, 200]}
          />
        </HeyThere>
      </Canvas>
    </View>
  );
}

export default App;
