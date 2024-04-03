import { getPointInBetweenByPerc, Home as H, Planet } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { Ref, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHexasphere } from '@end/hexasphere';
import gsap from 'gsap';
// @ts-ignore
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { BufferGeometry, MathUtils, NormalBufferAttributes } from 'three';

gsap.registerPlugin(MotionPathPlugin);

function useCameraPathPoints(
  cam: THREE.PerspectiveCamera,
  selectedTile?: { x: number; y: number; z: number }
) {

  return useMemo(() => {
    const { x, y, z } = selectedTile ?? {};

    const pointToPanTo = new THREE.Vector3(x, y, z);

    const center = new THREE.Vector3(0, 0, 0);

    const { x: camX, y: camY, z: camZ } = cam.position;
    const currentCameraPosition = new THREE.Vector3(camX, camY, camZ);

    const cameraToCenter = currentCameraPosition.distanceTo(center);

    const distanceToCenter = pointToPanTo.distanceTo(center);
    const distanceToCamera = cameraToCenter - distanceToCenter;
    const movePointToCamera = center
      .clone()
      .add(pointToPanTo)
      .normalize()
      .multiplyScalar(distanceToCamera);

    pointToPanTo.add(movePointToCamera);

    const pointsToPlotPlotOnCameraPath = 64;
    const pointsOnCameraPath: THREE.Vector3[] = [];

    for (let index = 0; index < pointsToPlotPlotOnCameraPath; index++) {
      const percent = index * (1 / pointsToPlotPlotOnCameraPath);
      // every 1/64 %, plot a point between from and to
      const pointBetweenFromAndTo = getPointInBetweenByPerc(
        currentCameraPosition,
        pointToPanTo,
        percent
      );

      pointsOnCameraPath.push(pointBetweenFromAndTo);
    }

    const points32 = new Float32Array(
      pointsOnCameraPath.flatMap((p) => [p.x, p.y, p.z])
    );

    return { points32, pointsV3: pointsOnCameraPath, pointToPanTo };
  }, [selectedTile, cam]);
}

function useDebugPath(
  f: { x: number; y: number; z: number },
  t?: { x: number; y: number; z: number } | null,
  cam?: THREE.PerspectiveCamera
) {
  return useMemo(() => {
    if (!t || !cam?.position) {
      return {};
    }

    const from = new THREE.Vector3(
      cam.position.x,
      cam.position.y,
      cam.position.z
    );
    const to = new THREE.Vector3(t.x, t.y, t.z);

    const equatorV3: THREE.Vector3[] = [];
    for (let index = 0; index < 64; index++) {
      const angle = (index / 64) * 2 * Math.PI;
      const x = 60 * Math.cos(angle);
      const z = 60 * Math.sin(angle);
      const p = new THREE.Vector3(x, 0, z);
      p.applyEuler(new THREE.Euler(0, 0, Math.PI / 2));
      equatorV3.push(new THREE.Vector3(x, 0, z));
    }

    const center = new THREE.Vector3(0, 0, 0);

    const pointsOnPortalCurve = 64;
    const pointsOnCameraPath: THREE.Vector3[] = [];
    for (let index = 0; index < pointsOnPortalCurve; index++) {
      const percent = index * (1 / pointsOnPortalCurve);
      // every 1/64 %, plot a point between from and to
      const pointBetweenFromAndTo = getPointInBetweenByPerc(from, to, percent);

      // distance from point between from and to and center of sphere
      const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);

      // distance from point between from and to and portal curve
      const distanceToSurface = 60 - distanceToCenter;

      // vector to move point between from and to the surface of the portal curve
      const movePointBetweenFromOrToToPortalCurve = center
        .clone()
        .sub(pointBetweenFromAndTo)
        .normalize()
        .multiplyScalar(-distanceToSurface);

      // move point between from and to the portal curve
      pointBetweenFromAndTo.add(movePointBetweenFromOrToToPortalCurve);

      pointsOnCameraPath.push(pointBetweenFromAndTo);
    }

    const points32 = new Float32Array(
      pointsOnCameraPath.flatMap((p) => [p.x, p.y, p.z])
    );

    const equator32 = new Float32Array(
      equatorV3.flatMap((p) => [p.x, p.y, p.z])
    );

    const quickestPathCurve = new THREE.CatmullRomCurve3(pointsOnCameraPath);
    const equator = new THREE.CatmullRomCurve3(equatorV3);

    const newCurve = (() => {
      const point1 = getPointInBetweenByPerc(from, to, 0.1);
      const point2 = getPointInBetweenByPerc(from, to, 0.9);

      // const point3 = getPointInBetweenByPerc(from, to, 0.5);

      function pushPoint(point: THREE.Vector3) {
        // distance from point between from and to and center of sphere
        const distanceToCenter = point.distanceTo(center);

        // distance from point between from and to and portal curve
        const distanceToSurface = 150 - distanceToCenter;

        // vector to move point between from and to the surface of the portal curve
        const movePointBetweenFromOrToToPortalCurve = center
          .clone()
          .sub(point)
          .normalize()
          .multiplyScalar(-distanceToSurface);

        // move point between from and to the portal curve
        point.add(movePointBetweenFromOrToToPortalCurve);
      }

      const northPole = new THREE.Vector3(0, 50, 0);
      const southPole = new THREE.Vector3(0, -50, 0);

      const pole = (point: THREE.Vector3) => {
        if (point.x === 0 && point.z === 0) {
          // at the north pole
          return new THREE.Vector3(50, 0, 0);
        }

        if (point.x === 0 && point.y === 0) {
          // at the south pole
          return new THREE.Vector3(-50, 0, 0);
        }

        return point.y < 0 ? southPole : northPole;
      };

      const toTowardsFurthestPole = to.clone();
      const movePointTowardsFurthestPole = pole(to)
        .clone()
        .sub(toTowardsFurthestPole)
        .normalize()
        .multiplyScalar(-20);

      toTowardsFurthestPole.add(movePointTowardsFurthestPole);

      const fromTowardsFurthestPole = from.clone();
      const moveFromTowardsFurthestPole = pole(from)
        .clone()
        .sub(fromTowardsFurthestPole)
        .normalize()
        .multiplyScalar(-20);

      // toTowardsFurthestPole.add(movePointTowardsFurthestPole);
      fromTowardsFurthestPole.add(moveFromTowardsFurthestPole);

      const toSurface = to.clone();
      const fromSurface = from.clone();

      pushPoint(to);
      pushPoint(from);
      pushPoint(toTowardsFurthestPole);
      pushPoint(fromTowardsFurthestPole);

      function createMeridian(radius: number, y: number) {
        const points = [];
        for (let index = 0; index < 64; index++) {
          const angle = (index / 64) * 2 * Math.PI;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);

          points.push(new THREE.Vector3(x, y, z));
        }
        return points;
      }

      const pointFromRotationPointToCenter = (() => {
        // const pl = pole.clone();
        return new THREE.Vector3(
          pole(from).x,
          toTowardsFurthestPole.y,
          pole(from).z
        );
      })();

      // console.log(
      //   'pointFromRotationPointToCenter',
      //   pointFromRotationPointToCenter
      // );

      const radius = pointFromRotationPointToCenter.distanceTo(
        toTowardsFurthestPole
      );

      const meridian = createMeridian(radius, toTowardsFurthestPole.y);

      function createFromPointToMeridian(
        m: THREE.Vector3[],
        f: THREE.Vector3,
        t: THREE.Vector3
      ) {
        // console.log({ m });

        // const newCenter = new THREE.Vector3(0, t.y, 0);
        // const newCenterTowardsFrom = pointFromRotationPointToCenter
        //   .clone()
        //   .sub(newCenter)
        //   .normalize();
        // console.log({directionV3})

        // const poleForTo = pole(t);

        const distanceToNorthPole =
          pointFromRotationPointToCenter.distanceTo(northPole);
        const distanceToSouthPole =
          pointFromRotationPointToCenter.distanceTo(southPole);

        const dv = f.clone().sub(pointFromRotationPointToCenter).normalize();

        const poleForMeridian = dv.y < 0 ? northPole : southPole;

        const pointWhenCameraIsOnPole = (() => {
          if (!cam) {
            return undefined;
          }

          const pole =
            cam.position.y > 159
              ? 'NORTH'
              : cam.position.y < -159
              ? 'SOUTH'
              : 'NONE';

          if (pole === 'NORTH') {
            // up is west
            if (cam.position.x > 0) {
              const dir = northPole
                .clone()
                .sub(new THREE.Vector3(0, 0, 50))
                .normalize()
                .multiplyScalar(-5);

              return northPole.clone().add(dir);
            }

            return undefined;
          }

          return undefined;
        })();

        const pointsOnPortalCurve = 64;
        const fromPointToMeridian: THREE.Vector3[] = [];
        let lastDt = 0;
        let intersectionPoints: THREE.Vector3[] = [];
        for (let index = 0; index < pointsOnPortalCurve; index++) {
          const percent = index * (1 / pointsOnPortalCurve);
          // every 1/64 %, plot a point between from and to
          const pointBetweenFromAndTo = getPointInBetweenByPerc(
            f,
            poleForMeridian,
            percent
          );
          const pointBetweenToAndMeridian = getPointInBetweenByPerc(
            t,
            poleForMeridian,
            percent
          );

          const d = MathUtils.radToDeg(
            pointBetweenFromAndTo
              .clone()
              .sub(pointFromRotationPointToCenter)
              .angleTo(poleForMeridian)
          );

          const e = MathUtils.radToDeg(
            pointBetweenToAndMeridian
              .clone()
              .sub(pointFromRotationPointToCenter)
              .angleTo(poleForMeridian)
          );

          // console.log(d)

          if (d > 90 && d < 95) {
            intersectionPoints.push(pointBetweenFromAndTo);
          }

          if (e > 90 && e < 95) {
            intersectionPoints.push(pointBetweenToAndMeridian);
          }

          // if(b.y > 0 && !intersectionPoint) {
          //   intersectionPoint = pointBetweenFromAndTo;
          // }
          // if (c > 90 && c < 92) {
          //   intersectionPoint = pointBetweenFromAndTo;
          // }

          // if ((dt > lastDt || lastDt === 0) && !intersectionPoint) {
          //   if (lastDt !== 0) {
          //     intersectionPoint = pointBetweenFromAndTo;
          //   } else {
          //     lastDt = dt;
          //   }
          // } else {
          //   lastDt = dt;
          // }

          // distance from point between from and to and center of sphere
          const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);

          // distance from point between from and to and portal curve
          const distanceToSurface = 60 - distanceToCenter;

          // vector to move point between from and to the surface of the portal curve
          const movePointBetweenFromOrToToMeridian = center
            .clone()
            .sub(pointBetweenFromAndTo)
            .normalize()
            .multiplyScalar(-distanceToSurface);

          // move point between from and to the portal curve
          pointBetweenFromAndTo.add(movePointBetweenFromOrToToMeridian);

          fromPointToMeridian.push(pointBetweenFromAndTo);
        }

        let closestPointOnMeridian: THREE.Vector3 = intersectionPoints[0];
        let closestPointOnMeridian1: THREE.Vector3 = intersectionPoints[0];
        let leastDis = 0;
        let leastDisTo = 0;

        meridian.forEach((pom: THREE.Vector3) => {
          intersectionPoints.forEach((ips: THREE.Vector3) => {
            const dis = pom.distanceTo(ips);
            // console.log(dis);
            if (leastDis === 0 || dis < leastDis) {
              leastDis = dis;
              closestPointOnMeridian = pom;
            }
          });

          const dis1 = pom.distanceTo(toTowardsFurthestPole);
          if (leastDisTo === 0 || dis1 < leastDisTo) {
            leastDisTo = dis1;
            closestPointOnMeridian1 = pom;
          }
        });

        // const z = intersectionPoints.sort(
        //   (a: THREE.Vector3, b: THREE.Vector3) =>
        //     poleForMeridian.distanceTo(a) - poleForMeridian.distanceTo(b)
        // );

        // console.log(cam?.position);

        return {
          mer: [poleForMeridian, ...fromPointToMeridian],
          ip: [closestPointOnMeridian, closestPointOnMeridian1],
        };
      }

      // TODO 1. draw points from from point to to meridian
      const { mer: fromPointToMeridian, ip } = createFromPointToMeridian(
        meridian,
        from,
        toTowardsFurthestPole
      );

      const divisionsOfMeridianPath = 64;
      const pointsOnMeridianPath: THREE.Vector3[] = [];
      for (let index = 0; index < divisionsOfMeridianPath; index++) {
        const percent = index * (1 / divisionsOfMeridianPath);
        // every 1/64 %, plot a point between from and to
        const pointOnMeridianPath = getPointInBetweenByPerc(
          ip[0],
          ip[1],
          percent
        );

        // distance from point between from and to and center of sphere
        const distanceToCenter = pointOnMeridianPath.distanceTo(
          pointFromRotationPointToCenter
        );

        // distance from point between from and to and portal curve
        const distanceToSurface = 170 - distanceToCenter;

        // vector to move point between from and to the surface of the portal curve
        const movePointBetweenFromOrToToPortalCurve =
          pointFromRotationPointToCenter
            .clone()
            .sub(pointOnMeridianPath)
            .normalize()
            .multiplyScalar(-distanceToSurface);

        // move point between from and to the portal curve
        pointOnMeridianPath.add(movePointBetweenFromOrToToPortalCurve);

        pointsOnMeridianPath.push(pointOnMeridianPath);
      }

      const toToMeridianPath: THREE.Vector3[] = [];
      for (let index = 0; index < divisionsOfMeridianPath; index++) {
        const percent = index * (1 / divisionsOfMeridianPath);
        const toRaised = new THREE.Vector3(t.x, t.y, t.z);
        pushPoint(toRaised);

        const pointOnMeridianPath = getPointInBetweenByPerc(
          toRaised,
          pointsOnMeridianPath[pointsOnMeridianPath.length - 1],
          percent
        );

        toToMeridianPath.push(pointOnMeridianPath);
      }

      const fromToMeridianPath: THREE.Vector3[] = [];
      for (let index = 0; index < divisionsOfMeridianPath; index++) {
        const percent = index * (1 / divisionsOfMeridianPath);
        const pointOnMeridianPath = getPointInBetweenByPerc(
          new THREE.Vector3(f.x, f.y, f.z),
          pointsOnMeridianPath[0],
          percent
        );

        fromToMeridianPath.push(pointOnMeridianPath);
      }

      // TODO 2. draw points from from merdian to from point

      // TODO 3. wire up curves into one path

      return {
        mer: [
          to,
          from,
          toTowardsFurthestPole,
          fromTowardsFurthestPole,
          pointFromRotationPointToCenter,
          ...meridian,
          ...fromPointToMeridian,
        ],
        ip: [
          ...fromToMeridianPath,
          ...pointsOnMeridianPath,
          ...toToMeridianPath,
        ],
      };
    })();

    return {
      equator32,
      points32,
      pointsV3: pointsOnCameraPath,
      newCurve: new Float32Array(newCurve.mer.flatMap((p) => [p.x, p.y, p.z])),
      ip: newCurve.ip
        ? new Float32Array(
            newCurve.ip.flatMap((p) => (p ? [p?.x, p?.y, p?.z] : []))
          )
        : new Float32Array(),
      ipV3: newCurve.ip,
    };
  }, [f, t, cam?.position]);
}

export default function Home() {
  const { width } = useWindowDimensions();
  const ref = useRef(null);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    cam.position.set(0, 0, 160);
    return cam;
  }, []);
  const { tiles, hexasphere, setReset, reset } = useHexasphere();
  const t = tiles[4];
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
    z: number;
  }>();
  const [selectedTile1, setSelectedTile1] = useState<
    | {
        x: number;
        y: number;
        z: number;
      }
    | undefined
    | null
  >();

  // console.log({ selectedTile });
  // console.log({ selectedTile1 });

  const { points32, pointsV3, pointToPanTo } = useCameraPathPoints(
    cam,
    selectedTile
  );

  const pointsRef = useRef<Ref<BufferGeometry<NormalBufferAttributes>>>();

  const debugPath = useDebugPath(cam.position, selectedTile1, cam);
  useEffect(() => {
    if (ref.current && selectedTile && debugPath.pointsV3) {
      const curve = new THREE.CatmullRomCurve3(pointsV3);
      // const curve = new THREE.QuadraticBezierCurve3(
      //   debugPath.pointsV3[0],
      //   debugPath.pointsV3[1],
      //   debugPath.pointsV3[2]
      // );

      // @ts-ignore
      // ref.current.enabled = false;
      // @ts-ignore
      // ref.current.update();

      // gsap.to(cam.position, {
      //   duration: 1,
      //   motionPath: {
      //     path: curve
      //       .getSpacedPoints(100)
      //       .map((p: any) => ({ x: p.x, y: p.y, z: p.z })),
      //   },
      //   onComplete: () => {
      //     // // @ts-ignore
      //     // ref.current.enabled = true;
      //     // // @ts-ignore
      //     // ref.current.update();
      //   },
      //   onUpdate: () => {
      //     // @ts-ignore
      //     // ref.current.update();
      //   },
      // });
    }
  }, [ref.current, cam, pointsV3, debugPath]);

  const [equator] = useMemo(() => {
    const points = [];
    for (let index = 0; index < 64; index++) {
      const angle = (index / 64) * 2 * Math.PI;
      const x = 60 * Math.cos(angle);
      const z = 60 * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }

    return [
      {
        points,
        points32: new Float32Array(points.flatMap((p: any) => [p.x, p.y, p.z])),
      },
    ];
  }, []);

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <Planet
        setReset={setReset}
        reset={reset}
        tiles={tiles}
        hexasphere={hexasphere}
        selectedTile={selectedTile}
        setSelectedTile={setSelectedTile}
        selectedTile1={selectedTile1}
        setSelectedTile1={setSelectedTile1}
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
              {/*<points>*/}
              {/*  <bufferGeometry>*/}
              {/*    <bufferAttribute*/}
              {/*      attach="attributes-position"*/}
              {/*      count={equator.points32.length / 3}*/}
              {/*      itemSize={3}*/}
              {/*      array={equator.points32}*/}
              {/*    />*/}
              {/*  </bufferGeometry>*/}
              {/*  <pointsMaterial size={2} color="blue" transparent />*/}
              {/*</points>*/}
              {/*<points rotation={new THREE.Euler(Math.PI / 2)}>*/}
              {/*  <bufferGeometry>*/}
              {/*    <bufferAttribute*/}
              {/*      attach="attributes-position"*/}
              {/*      count={equator.points32.length / 3}*/}
              {/*      itemSize={3}*/}
              {/*      array={equator.points32}*/}
              {/*    />*/}
              {/*  </bufferGeometry>*/}
              {/*  <pointsMaterial size={2} color="red" transparent />*/}
              {/*</points>*/}
              {/*{debugPath.newCurve ? (*/}
              {/*  <>*/}
              {/*    <points rotation={new THREE.Euler(0, 0, Math.PI / 2)}>*/}
              {/*      <bufferGeometry>*/}
              {/*        <bufferAttribute*/}
              {/*          attach="attributes-position"*/}
              {/*          count={debugPath.equator32.length / 3}*/}
              {/*          itemSize={3}*/}
              {/*          array={debugPath.equator32}*/}
              {/*        />*/}
              {/*      </bufferGeometry>*/}
              {/*      <pointsMaterial size={2} color="orange" transparent />*/}
              {/*    </points>*/}
              {/*    <points>*/}
              {/*      <bufferGeometry>*/}
              {/*        <bufferAttribute*/}
              {/*          attach="attributes-position"*/}
              {/*          count={debugPath.points32.length / 3}*/}
              {/*          itemSize={3}*/}
              {/*          array={debugPath.points32}*/}
              {/*        />*/}
              {/*      </bufferGeometry>*/}
              {/*      <pointsMaterial size={4} color="green" transparent />*/}
              {/*    </points>*/}
              {/*    <points>*/}
              {/*      <bufferGeometry>*/}
              {/*        <bufferAttribute*/}
              {/*          attach="attributes-position"*/}
              {/*          count={debugPath.newCurve.length / 3}*/}
              {/*          itemSize={3}*/}
              {/*          array={debugPath.newCurve}*/}
              {/*        />*/}
              {/*      </bufferGeometry>*/}
              {/*      <pointsMaterial size={6} color="hotpink" transparent />*/}
              {/*    </points>*/}
              {/*    <points>*/}
              {/*      <bufferGeometry>*/}
              {/*        <bufferAttribute*/}
              {/*          attach="attributes-position"*/}
              {/*          count={debugPath.ip.length / 3}*/}
              {/*          itemSize={3}*/}
              {/*          array={debugPath.ip}*/}
              {/*        />*/}
              {/*      </bufferGeometry>*/}
              {/*      <pointsMaterial size={8} color="red" transparent />*/}
              {/*    </points>*/}
              {/*  </>*/}
              {/*) : null}*/}
            </Canvas>
            {footer}
          </>
        )}
      </Planet>
    </H>
  );
}
