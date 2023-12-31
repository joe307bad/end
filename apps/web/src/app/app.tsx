import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import {
  Lights,
  Planet,
  Providers,
  SolarSystem,
  Sun,
  SystemDetails,
} from '@end/components';
import './app.module.less';
import { OrbitControls } from '@react-three/drei';
import { faker } from '@faker-js/faker';

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
    fetch('http://localhost:3000/system', {
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
        <SystemDetails
          discoverSystem={discoverSystem}
          name={name}
          setName={setName}
          tags={['planetary system']}
        >
          <System />
        </SystemDetails>
      </Providers>
    </View>
  );
}

export default App;
