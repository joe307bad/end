import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import {
  Lights,
  Planet,
  SolarSystem,
  Sun,
  SystemDetails,
} from '@end/components';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        </SolarSystem>
      </Canvas>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView>
      <View style={{ height: '100%', width: '100%' }}>
        <SystemDetails name="Galator 9" id="2r23fr" tags={['planetary system']}>
          <System />
        </SystemDetails>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
});
