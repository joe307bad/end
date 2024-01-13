import React, { ReactNode, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import {
  Container,
  Landing,
  Lights,
  Planet,
  Providers,
  SolarSystem,
  Sun,
} from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { faker } from '@faker-js/faker';
import './app.module.scss';

import {
  createBrowserRouter,
  NavigateFunction,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Home } from '../pages/Home';
import { Conquest } from '../pages/Conquest';
import { Economy } from '../pages/Economy';
import { Story } from '../pages/Story';

function WithNavigate({
  children,
}: {
  children: (n: NavigateFunction) => ReactNode;
}) {
  const navigate = useNavigate();
  return children(navigate);
}

function Page({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  console.log({ pathname });
  return (
    <Container navigate={navigate} currentRoute={pathname}>
      {children}
    </Container>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Page>
        <WithNavigate>
          {(n) => <Landing goToHome={() => n('/home')} />}
        </WithNavigate>
      </Page>
    ),
  },
  {
    path: '/home',
    element: (
      <Page>
        <Home />
      </Page>
    ),
  },
  {
    path: '/story',
    element: (
      <Page>
        <Story />
      </Page>
    ),
  },
  {
    path: '/economy',
    element: (
      <Page>
        <Economy />
      </Page>
    ),
  },
  {
    path: '/conquest',
    element: (
      <Page>
        <Conquest />
      </Page>
    ),
  },
]);

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
  const word = faker.random.word();
  const [n, setName] = useState(word.charAt(0).toUpperCase() + word.slice(1));

  const discoverSystem = useCallback(() => {
    fetch('https://end.fly.dev/system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: n }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }, [n]);

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Providers>
        <RouterProvider router={router} />
        {/*<SystemDetails*/}
        {/*  discoverSystem={discoverSystem}*/}
        {/*  name={name}*/}
        {/*  setName={setName}*/}
        {/*  tags={['planetary system']}*/}
        {/*  h1={Styles.h1}*/}
        {/*>*/}
        {/*  <System />*/}
        {/*</SystemDetails>*/}
      </Providers>
    </View>
  );
}

export default App;
