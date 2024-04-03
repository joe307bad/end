import { Home as H, Planet } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHexasphere } from '@end/hexasphere';

export default function Home() {
  const ref = useRef(null);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    cam.position.set(0, 0, 160);
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
        setSelectedTile={setSelectedTile}
      >
        {(hexasphere, controls, footer) => (
          <>
            {controls}
            <Canvas
              style={{
                flex: 1,
                minWidth: 2000,
                width: '150%',
                marginLeft: -600,
              }}
              camera={cam}
            >
              <OrbitControls maxZoom={0.25} ref={ref} camera={cam} />
              {hexasphere}
            </Canvas>
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
