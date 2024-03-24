import { getPointInBetweenByPerc, Home as H, Planet } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions } from 'react-native';
import { TrackballControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHexasphere } from '@end/hexasphere';
import gsap from 'gsap';
// @ts-ignore
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';

gsap.registerPlugin(MotionPathPlugin);

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

      const { x: camX, y: camY, z: camZ } = cam.position;
      const currentCameraPosition = new THREE.Vector3(camX, camY, camZ);
      const cameraToCenter = currentCameraPosition.distanceTo(center);

      const distanceToCenter = point.distanceTo(center);
      const distanceToCamera = cameraToCenter - distanceToCenter;

      const movePointToCamera = center
        .clone()
        .sub(point)
        .normalize()
        .multiplyScalar(-distanceToCamera);

      point.add(movePointToCamera);

      const pointsOnPortalCurve = 64;
      const points = [];
      const radius = 160;

      for (let index = 0; index < pointsOnPortalCurve; index++) {
        const percent = index * (1 / pointsOnPortalCurve);
        // every 1/64 %, plot a point between from and to
        const pointBetweenFromAndTo = getPointInBetweenByPerc(
          currentCameraPosition,
          point,
          percent
        );

        // distance from point between from and to and center of sphere
        const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);

        // distance from point between from and to and portal curve
        const distanceToSurface = radius - distanceToCenter;

        // vector to move point between from and to the surface of the portal curve
        const movePointBetweenFromOrToToPortalCurve = center
          .clone()
          .sub(pointBetweenFromAndTo)
          .normalize()
          .multiplyScalar(-distanceToSurface);

        // move point between from and to the portal curve
        pointBetweenFromAndTo.add(movePointBetweenFromOrToToPortalCurve);

        points.push(pointBetweenFromAndTo);
      }

      const curve = new THREE.CatmullRomCurve3(points);

      gsap.to(cam.position, {
        duration: 2,
        motionPath: {
          path: curve
            .getPoints(100)
            .map((p: any) => ({ x: p.x, y: p.y, z: p.z })),
        },
        onUpdate: () => {
          // @ts-ignore
          ref.current.update();
        },
      });
    }
  }, [selectedTile, cam]);

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
              <TrackballControls rotateSpeed={3} ref={ref} camera={cam} />
              {hexasphere}
            </Canvas>
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
