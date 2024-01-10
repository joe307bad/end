import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import {
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
  const [name, setName] = useState(
    word.charAt(0).toUpperCase() + word.slice(1)
  );

  const discoverSystem = useCallback(() => {
    fetch('https://end.fly.dev/system', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.a
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }, [name]);

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Providers>
        <Landing />
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
