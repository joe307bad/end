import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import { OrbitControls, OrthographicCamera } from '@react-three/drei/native';
import useControls from 'r3f-native-orbitcontrols';
import { HeyThere } from '@end/components';

export default function App() {
  const [OrbitControls, events] = useControls();

  return (
    // @ts-ignore
    <View {...events} style={styles.container}>
      <Canvas>
        <HeyThere>
          <OrbitControls />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
