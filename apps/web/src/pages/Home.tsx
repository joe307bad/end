import { Home as H, Planet } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHexasphere } from '@end/hexasphere';
import { useWindowDimensions } from 'react-native';

export default function Home() {
  const ref = useRef(null);

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
  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);

    if (width < 835) {
      cam.position.set(0, 0, 300);
    } else {
      cam.position.set(0, 0, 160);
    }

    return cam;
  }, []);
  const { tiles, hexasphere, setReset, reset } = useHexasphere();
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
    z: number;
  }>();

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
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
                ...responsiveness,
              }}
              camera={cam}
            >
              {hexasphere}
            </Canvas>
            {controls}
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
