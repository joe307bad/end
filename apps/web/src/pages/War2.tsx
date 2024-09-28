import { H1, H4, View } from 'tamagui';
import { useEndApi } from '@end/data/web';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { subscribeKey } from 'valtio/utils';
import { Coords, Hexasphere, hexasphere } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { GameTabs, PortalPath, useResponsive } from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';

export function War2() {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);

  useEffect(() => {
    const unsubscribe = subscribeKey(warService.derived, 'cameraPath', (s) => {
      console.log({ s });
    });

    return () => unsubscribe();
  }, []);
  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1297) {
      return [[0, 160, 25], {}];
    }

    return [
      [0, 160, 25],
      {
        minWidth: 2000,
        width: '150%',
        marginLeft: -600,
      },
    ];
  }, [width]);
  const [menuOpen, setMenuOpen] = useState(true);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);
  const { bp } = useResponsive(menuOpen);

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View style={bp(['pl-10 flex items-start', 'hidden', 'block'])}>
        <H4>{warStore.name}</H4>
        {/*<Badge title={params.id} />*/}
      </View>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <Hexasphere portalPath={PortalPath} />
        <OrbitControls />
      </Canvas>
    </View>
  );
}
