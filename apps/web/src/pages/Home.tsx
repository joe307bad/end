import { Home as H, Planet } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHexasphere } from '@end/hexasphere';
import gsap from 'gsap';

export default function Home() {
  const { width } = useWindowDimensions();
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

  useEffect(() => {
    if (ref.current && selectedTile) {
      // const tile = faker.number.int({ min: 1, max: 3 });
      var { x, y, z } = selectedTile;
      const point = new THREE.Vector3(x, y, z);

      const center = new THREE.Vector3(0, 0, 0);
      const radius = 160;
      const distanceToCenter = point.distanceTo(center);
      const distanceToSurface = radius - distanceToCenter;
      const movePointBetweenFromOrToToPortalCurve = center
        .clone()
        .sub(point)
        .normalize()
        .multiplyScalar(-distanceToSurface);

      point.add(movePointBetweenFromOrToToPortalCurve);

      gsap.to(cam.position, {
        duration: 0.5,
        x: point.x,
        y: point.y,
        z: point.z,
        onComplete: () => {
          // cam.lookAt(new THREE.Vector3(0, 0, 0));
          // @ts-ignore
          ref.current.update();
        },
      });
    }
  }, [selectedTile]);

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
              <OrbitControls ref={ref} camera={cam} />
              {hexasphere}
            </Canvas>
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
