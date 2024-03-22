import { Home as H, Planet, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/rn';
import { Canvas } from '@react-three/fiber/native';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';

export default function Home({ logOut }: { logOut: () => void }) {
  const { width } = useWindowDimensions();
  const [OrbitControls, events] = useControls();

  return (
    <>
      <H
        database={database}
        sync={sync}
        apiUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}
      >
        <View style={{ flex: 1 }} {...events}>
          <Planet>
            {(children) => {
              return (
                <Canvas
                  style={{ flex: 1, width: '100%' }}
                  camera={{
                    position: [0, width < 600 ? 300 : 160, 25],
                    fov: 45,
                  }}
                >
                  <OrbitControls />
                  {children}
                </Canvas>
              );
            }}
          </Planet>
        </View>
      </H>
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </>
  );
}
