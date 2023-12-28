import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import { OrthographicCamera } from '@react-three/drei/native';
import useControls from 'r3f-native-orbitcontrols';
import {
  Lights,
  Planet,
  SolarSystem,
  Sun,
  SystemDetails,
} from '@end/components';

function System() {
  const [OrbitControls, events] = useControls();
  return (
    <View {...events} style={styles.container}>
      <Canvas camera={{ position: [0, 40, 45], fov: 45 }}>
        <SolarSystem>
          <Sun />
          <Planet />
          <Lights />
          <OrbitControls />
          {/*<OrthographicCamera*/}
          {/*  makeDefault*/}
          {/*  zoom={10}*/}
          {/*  top={200}*/}
          {/*  bottom={-200}*/}
          {/*  left={200}*/}
          {/*  right={-200}*/}
          {/*  near={1}*/}
          {/*  far={2000}*/}
          {/*  position={[0, 0, 200]}*/}
          {/*/>*/}
        </SolarSystem>
      </Canvas>
    </View>
  );
}

export default function App() {
  return (
    // @ts-ignore
    <SystemDetails>
      <System />
    </SystemDetails>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
});
