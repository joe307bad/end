import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text } from 'react-native';
import 'text-encoding-polyfill';
import {
  Container,
  Landing as LandingView,
  Providers,
  tamaguiTokens,
} from '@end/components';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import Home from '../pages/Home';
import * as Font from 'expo-font';
import { LogBox } from 'react-native';
import { useAuth } from '@end/auth';
import { EndApiProvider, useEndApi } from '@end/data/rn';
import { DatabaseProvider } from '@nozbe/watermelondb/react';

const Drawer = createDrawerNavigator();

function Landing({
  setLoggedIn,
}: {
  setLoggedIn: (loggedIn: boolean) => void;
}) {
  const { services } = useEndApi();
  return (
    <Container>
      <LandingView services={services} goToHome={() => setLoggedIn(true)} />
    </Container>
  );
}

const MyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: tamaguiTokens.color.black.val,
    primary: 'rgb(255, 45, 85)',
  },
};

export default class App extends React.Component {
  state = {
    fontLoaded: false,
  };

  async componentDidMount() {
    LogBox.ignoreAllLogs();
    await Font.loadAsync({
      ShineTypewriterRegular: require('../../assets/ShineTypewriterRegular.ttf'),
    });
    this.setState({ fontLoaded: true });
  }

  render() {
    return this.state.fontLoaded ? (
      <EndApiProvider baseUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}>
        <Routes />
      </EndApiProvider>
    ) : (
      <></>
    );
  }
}

export function Routes() {
  const { getToken } = useAuth();
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const { services } = useEndApi();

  return (
    <Providers>
      <DatabaseProvider database={services.endApi.database}>
        <StatusBar translucent backgroundColor={'black'} />
        <NavigationContainer theme={MyTheme}>
          {!loggedIn ? (
            <Drawer.Navigator
              initialRouteName="Landing"
              screenOptions={{ headerShown: false, swipeEdgeWidth: 0 }}
            >
              <Drawer.Screen
                name="Landing"
                component={() => <Landing setLoggedIn={setLoggedIn} />}
              />
            </Drawer.Navigator>
          ) : (
            <Drawer.Navigator initialRouteName="Landing">
              <Drawer.Screen
                name="Home"
                component={() => <Home logOut={() => setLoggedIn(false)} />}
              />
            </Drawer.Navigator>
          )}
        </NavigationContainer>
      </DatabaseProvider>
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
