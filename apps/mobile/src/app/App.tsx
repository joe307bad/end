import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import {
  Landing as LandingView,
  Lights,
  Planet,
  Providers,
  SolarSystem,
  Sun,
  SystemDetails,
  tamaguiTokens,
} from '@end/components';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { Home } from '../pages/Home';
import * as Font from 'expo-font';

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

function Landing({
  navigation,
}: {
  navigation: { navigate(route: string): void };
}) {
  return <LandingView goToHome={() => navigation.navigate('Home')} />;
}

const MyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: tamaguiTokens.color.black.val,
    primary: 'rgb(255, 45, 85)',
  },
};

export default class App extends React.Component<any, any> {
  state = {
    fontLoaded: false,
  };

  async componentDidMount() {
    await Font.loadAsync({
      ShineTypewriterRegular: require('../../assets/ShineTypewriterRegular.ttf'),
    });
    this.setState({ fontLoaded: true });
  }

  render() {
    console.log({ loaded: this.state.fontLoaded });
    return this.state.fontLoaded ? <Routes /> : <></>;
  }
}

export function Routes() {
  return (
    <Providers>
      <NavigationContainer theme={MyTheme}>
        <Drawer.Navigator initialRouteName="Landing">
          <Drawer.Screen name="Landing" component={Landing} />
          <Drawer.Screen name="Home" component={Home} />
        </Drawer.Navigator>
      </NavigationContainer>
    </Providers>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
});
