import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import {
  Landing as LandingView,
  Lights,
  Planet,
  SolarSystem,
  Sun,
  SystemDetails,
} from '@end/components';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Home } from '../pages/Home';

function System() {
  const [OrbitControls, events] = useControls();
  return (
    <SystemDetails name="Galator 92" id="2r23fr" tags={['planetary system']}>
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
    </SystemDetails>
  );
}

const Drawer = createDrawerNavigator();

function WithNavigate({ children }: { children: (n: any) => any }) {
  const navigate = () => {};
  return children(navigate);
}

function Landing() {
  return (
    <WithNavigate>
      {(n) => <LandingView goToHome={() => n('/home')} />}
    </WithNavigate>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Landing">
        <Drawer.Screen name="Landing" component={Landing} />
        <Drawer.Screen name="Home" component={Home} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
});
