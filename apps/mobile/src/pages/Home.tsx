import { Home as H, Planet, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/rn';
import { Canvas } from '@react-three/fiber/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import { useHexasphere } from '@end/hexasphere';

export default function Home({ logOut }: { logOut: () => void }) {
  const [OrbitControls, events] = useControls();

  const { tiles, hexasphere, setReset, reset } = useHexasphere();
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
    z: number;
  }>();

  return (
    <View style={{ flex: 1 }} {...events}>
      <H
        database={database}
        sync={sync}
        apiUrl={process?.env?.EXPO_PUBLIC_API_BASE_URL}
      >
        <Planet
          setReset={setReset}
          reset={reset}
          tiles={tiles}
          hexasphere={hexasphere}
          selectedTile={selectedTile}
          setSelectedTile={(id) =>
            setSelectedTile(
              (prevId: { x: number; y: number; z: number } | undefined) => {
                const { x, y, z } = prevId ?? {};
                const { x: x1, y: y1, z: z1 } = id ?? {};
                return JSON.stringify({ x, y, z }) === JSON.stringify({ x: x1, y: y1, z: z1 })
                  ? undefined
                  : id;
              }
            )
          }
        >
          {(hexasphere, controls, footer) => (
            <>
              <Canvas
                style={{
                  flex: 1,
                }}
                camera={{ position: [0, 0, 160], fov: 100 }}
              >
                <OrbitControls />
                {hexasphere}
              </Canvas>
              {footer}
            </>
          )}
        </Planet>
      </H>
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </View>
  );
}
