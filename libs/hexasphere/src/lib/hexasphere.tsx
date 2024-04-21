import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import { extend, Object3DNode, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils, Vector3 } from 'three';
import gsap from 'gsap';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
// @ts-ignore
import tf from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { OrbitControls } from '@react-three/drei';
import { cameraPosition } from 'three/examples/jsm/nodes/accessors/CameraNode';
import { getPointInBetweenByPerc } from '@end/components';
// @ts-ignore
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';

gsap.registerPlugin(MotionPathPlugin);

extend({ TextGeometry });

const center = new THREE.Vector3(0, 0, 0);

const font = new FontLoader().parse(tf);
declare module '@react-three/fiber' {
  interface ThreeElements {
    textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
  }
}

function TileMesh({
  positions,
  indices,
  color,
  onClick,
  target,
  highlighted,
  selected,
  raised,
  centerPoint,
  sphereQuat,
  selectedTile,
}: any) {
  const mesh: any = useRef();
  const geo: any = useRef();
  const countGeo: any = useRef();
  const text: any = useRef();
  const textGeo: any = useRef();
  const cyl: any = useRef();
  const textMesh: any = useRef();
  const [countEdges, setCountEdges] = useState<any>();
  const [edges, setEdges] = useState<any>();

  // console.log(planetEndQ);

  useLayoutEffect(() => {
    if (geo.current) {
      geo.current.attributes.position.needsUpdate = true;
    }
  }, [positions]);

  const cube: any = useRef();

  useEffect(() => {
    if (geo.current && raised) {
      setEdges([
        new THREE.EdgesGeometry(geo.current, 50),
        new THREE.LineBasicMaterial({ color: 'black' }),
      ]);
      // const pth = new PointTextHelper();
      // mesh.current.add(pth);
      // pth.displayVertices(positions, {
      //   color: 'white',
      //   size: 10,
      //   format: (index) => `${index}`,
      // });
    }

    if (countGeo.current && text.current && cyl.current && textGeo.current) {
      const cp = new THREE.Vector3(centerPoint.x, centerPoint.y, centerPoint.z);

      cyl.current.rotation.x = MathUtils.degToRad(90);
      text.current?.position.copy(center.clone());
      text.current?.lookAt(cp.clone());
      text.current?.position.copy(cp.clone());
      // console.log('run');

      textGeo.current.computeBoundingBox();
      const b = textGeo.current.boundingBox.getCenter(new Vector3());
      textMesh.current.position.x -= b.x;
      textMesh.current.position.y -= b.y;
      textMesh.current.position.z += 1;

      setCountEdges([
        new THREE.EdgesGeometry(countGeo.current, 50),
        new THREE.LineBasicMaterial({ color: 'black' }),
      ]);
    }
  }, []);

  const { camera } = useThree();

  const randomNumber = useMemo(
    () => faker.number.int({ min: 1, max: 9 }).toString(),
    []
  );

  useFrame(() => {
    if (cube.current && text.current) {
      const b = text.current.position.clone();
      const a = new THREE.Object3D();
      a.position.set(b.x, b.y, b.z);
      a.lookAt(camera.position);

      const z = a.rotation.z;
      // //
      const cp = new THREE.Vector3(centerPoint.x, centerPoint.y, centerPoint.z);

      const dir1 = cp.clone().sub(center).normalize().multiplyScalar(10);
      cp.add(dir1);

      text.current.rotation.z = z;
    }
  });

  return !target ? null : (
    <>
      {raised ? (
        <mesh
          ref={text}
          position={[centerPoint.x, centerPoint.y, centerPoint.z]}
        >
          <mesh ref={cyl}>
            <cylinderGeometry
              ref={countGeo}
              attach="geometry"
              args={[2, 2, 2, 32]}
            />
            {countEdges?.[0] ? (
              <lineSegments geometry={countEdges[0]} material={countEdges[1]} />
            ) : null}
          </mesh>
          <mesh ref={textMesh}>
            <textGeometry
              ref={textGeo}
              args={[randomNumber, { font, size: 2, height: 0.25 }]}
            />
            <meshBasicMaterial
              side={THREE.DoubleSide}
              attach="material"
              color={'black'}
            />
          </mesh>
        </mesh>
      ) : null}
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <bufferGeometry ref={geo}>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={indices}
            count={indices.length}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color={selected ? 'yellow' : highlighted ? 'red' : color}
        />
      </mesh>
      {edges?.[0] ? (
        <lineSegments geometry={edges[0]} material={edges[1]} />
      ) : null}
      {/*<points>*/}
      {/*  <bufferGeometry>*/}
      {/*    <bufferAttribute*/}
      {/*      attach="attributes-position"*/}
      {/*      count={z.length / 3}*/}
      {/*      itemSize={3}*/}
      {/*      array={z}*/}
      {/*    />*/}
      {/*  </bufferGeometry>*/}
      {/*  <pointsMaterial size={10} color="red" transparent />*/}
      {/*</points>*/}
      {/*<mesh ref={cube}>*/}
      {/*  <boxGeometry args={[1, 1, 1]} />*/}
      {/*  <meshBasicMaterial color="red" />*/}
      {/*</mesh>*/}
    </>
  );
}

const poleIds = ['0,-50,0', '0,50,0'];

var camPosIndex = 0;

export function Hexasphere({
  tiles,
  selected,
  setSelected,
  portal,
}: {
  setSelected(id: { x: number; y: number; z: number }): void;
  selected?: { x: number; y: number; z: number };
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  tiles: any;
  hexasphere: any;
  portal?: any;
}) {
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const starColor = useMemo(() => faker.color.rgb({ format: 'hex' }), []);

  const { camera } = useThree();
  // const dirLight = useRef<DirectionalLight>(null);
  // useHelper(dirLight, DirectionalLightHelper, 1, 'red');

  function onClick(id: { x: number; y: number; z: number }) {
    setSelected(id);
  }

  const mesh: any = useRef();
  const [planetEndQ, setPlanetEndQ] = useState<any>();

  const cont: any = useRef();

  const [curX, setCurX] = useState<any>();

  const [pole1, pole2] = useMemo(() => {
    const pole1 = tiles
      .filter((t: any) => t.id === poleIds[0])
      .flatMap((pole: any) =>
        pole.neighbors.map(
          (n: any) => `${n.centerPoint.x},${n.centerPoint.y},${n.centerPoint.z}`
        )
      );
    const pole2 = tiles
      .filter((t: any) => t.id === poleIds[1])
      .flatMap((pole: any) =>
        pole.neighbors.map(
          (n: any) => `${n.centerPoint.x},${n.centerPoint.y},${n.centerPoint.z}`
        )
      );

    return [pole1, pole2];
  }, []);

  useEffect(() => {
    if (selected && mesh.current) {
      // const s = new THREE.Vector3(selected.x, selected.y, selected.z);
      // const dir = s.clone().sub(center).normalize().multiplyScalar(100);
      // s.add(dir);
      //
      // var tl = gsap.timeline();
      // const [x, y, z] = curX?.split(',') ?? [];
      //
      // const selectedId = `${selected.x},${selected.y},${selected.z}`;
      // const enteringPole = poleIds.some((p: string) => p === selectedId);
      // const exitingPole = poleIds.some((p: string) => p === curX);
      // const exitingNeighbor = [...pole1, ...pole2].some(
      //   (p: string) => p === curX
      // );
      // const neighborToNeighbor_pole1 = [curX, selectedId].every((t) =>
      //   pole1.some((n: string) => n === t)
      // );
      // const neighborToNeighbor_pole2 = [curX, selectedId].every((t) =>
      //   pole2.some((n: string) => n === t)
      // );
      //
      // const point = (() => {
      //   // const [x, y, z] = (selectedId === poleIds[0] ? closest1 : closest2)
      //   //   .split(',')
      //   //   .map((x: any) => Number(x));
      //   // TODO this is hardcoded for pole1, get pole2 "safe tile"
      //   const x = -0;
      //   const y = 42.532540386381314;
      //   const z = 26.2865556564728;
      //   const s1 = new THREE.Vector3(x, y, z);
      //   const dir = s1.clone().sub(center).normalize().multiplyScalar(100);
      //   s1.add(dir);
      //
      //   return s1;
      // })();

      // console.log(selected);

      // TODO first we detect if the curved path will come close to crossing over a polar max
      // TODO then if it will cross a polar max, shift the curved path to avoid the polar max

      // 1. detect if path will cross polar max
      //    if true:
      //      if from and to are both outside both poles and pole neighbors: go to Y pole first, then navigate to tile
      //      if to is on a polar max, go to safe tile then from
      //      if from is a polar max, and to is over the polar max, go to Y pole first

      // const yPole = new THREE.Vector3(0, 0, 50);
      // const dir1 = center.clone().sub(yPole).normalize().multiplyScalar(160);
      // const firstPoint = center.clone().add(dir1);

      // if (
      //   (enteringPole || exitingPole || exitingNeighbor) &&
      //   !neighborToNeighbor_pole1 &&
      //   !neighborToNeighbor_pole2
      // ) {
      // TODO allow for going from pole neighbor to pole neiGhbor without intermediate step
      // tl.to(camera.position, {
      //   duration: 0.75,
      //   x: firstPoint.x,
      //   y: firstPoint.y,
      //   z: firstPoint.z,
      //   onUpdate(q, b, c) {
      //     cont.current.update();
      //   },
      //   onComplete() {},
      // });
      // }

      // const yPlane = new THREE.Vector3(50, 0, 0);
      // const directionToYPlane_to = s
      //   .clone()
      //   .sub(yPlane)
      //   .normalize();
      // console.log('directionToYPlane_to', directionToYPlane_to.x);
      //
      // const c = new THREE.Vector3(x, y, z);
      // const directionToYPlane_from = c
      //   .clone()
      //   .sub(yPlane)
      //   .normalize();
      //
      // console.log('directionToYPlane_from', directionToYPlane_from.x);
      //
      // setCurX(selectedId);
      //
      // // TODO prevent from going through planet, probably with another intermediate step like above
      // tl.to(camera.position, {
      //   duration: 0.75,
      //   x: s.x,
      //   y: s.y,
      //   z: s.z,
      //   // delay: 1,
      //   onUpdate(q, b, c) {
      //     cont.current.update();
      //   },
      //   onComplete() {},
      // });

      var { x, y, z } = selected;
      const point = new THREE.Vector3(x, y, z);

      const center = new THREE.Vector3(0, 0, 0);

      const { x: camX, y: camY, z: camZ } = camera.position;

      const currentCameraPosition = new THREE.Vector3(camX, camY, camZ);
      const cameraPointOnSphere_dir = center
        .clone()
        .sub(currentCameraPosition)
        .normalize()
        .multiplyScalar(50);
      const cameraPointOnSphere = center.clone();
      cameraPointOnSphere.add(cameraPointOnSphere_dir);

      const dir = center.clone().sub(point).normalize().multiplyScalar(110);
      point.add(dir);

      const pointsOnPortalCurve = 64;
      const points = [];
      const radius = 160;
      for (let index = 0; index < pointsOnPortalCurve; index++) {
        const percent = index * (1 / pointsOnPortalCurve);
        const pointBetweenFromAndTo = getPointInBetweenByPerc(
          currentCameraPosition,
          point,
          percent
        );
        const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);
        const distanceToSurface = radius - distanceToCenter;

        const movePointBetweenFromOrToToCurve = center
          .clone()
          .sub(pointBetweenFromAndTo)
          .normalize()
          .multiplyScalar(distanceToSurface);

        pointBetweenFromAndTo.add(movePointBetweenFromOrToToCurve);

        points.push(point);
      }

      // gsap.to(camera.position, {
      //   duration: 2,
      //   motionPath: {
      //     path: points.map((p: any) => ({ x: p.x, y: p.y, z: p.z })),
      //   },
      //   onUpdate: () => {
      //     // // @ts-ignore
      //     // cont.current.update();
      //   },
      // });

      // const cameraToCenter = currentCameraPosition.distanceTo(center);
      //
      // const distanceToCenter = point.distanceTo(center);
      // const distanceToCamera = cameraToCenter - distanceToCenter;
      //
      // const movePointToCamera = center
      //   .clone()
      //   .sub(point)
      //   .normalize()
      //   .multiplyScalar(distanceToCamera);
      //
      // point.add(movePointToCamera);
      //
      // const pointsOnPortalCurve = 64;
      // const points = [];
      // const radius = 160;
      //
      // for (let index = 0; index < pointsOnPortalCurve; index++) {
      //   const percent = index * (1 / pointsOnPortalCurve);
      //   // every 1/64 %, plot a point between from and to
      //   const pointBetweenFromAndTo = getPointInBetweenByPerc(
      //     currentCameraPosition,
      //     point,
      //     percent
      //   );
      //
      //   // distance from point between from and to and center of sphere
      //   const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);
      //
      //   // distance from point between from and to and portal curve
      //   const distanceToSurface = radius - distanceToCenter;
      //
      //   // vector to move point between from and to the surface of the portal curve
      //   const movePointBetweenFromOrToToPortalCurve = center
      //     .clone()
      //     .sub(pointBetweenFromAndTo)
      //     .normalize()
      //     .multiplyScalar(distanceToSurface);
      //
      //   // move point between from and to the portal curve
      //   pointBetweenFromAndTo.add(movePointBetweenFromOrToToPortalCurve);
      //
      //   points.push(pointBetweenFromAndTo);
    }

    // const curve = new THREE.CatmullRomCurve3(points);

    // gsap.to(camera.position, {
    //   duration: 2,
    //   motionPath: {
    //     path: points.map((p: any) => ({ x: p.x, y: p.y, z: p.z })),
    //   },
    //   onUpdate: () => {
    //     // @ts-ignore
    //     cont.current.update();
    //   },
    // });
  }, [selected, camera.position, pole1, pole2]);

  const stars = useMemo(() => {
    const createStar = () => {
      const randomY = faker.number.int({ min: -1000, max: -50 });
      const randomY1 = faker.number.int({ min: 50, max: 1000 });

      const randomX = faker.number.int({ min: -1000, max: -50 });
      const randomX1 = faker.number.int({ min: 50, max: 1000 });

      const randomZ = faker.number.int({ min: -1000, max: -50 });
      const randomZ1 = faker.number.int({ min: 50, max: 1000 });

      return [
        faker.helpers.arrayElement([randomX, randomX1]),
        faker.helpers.arrayElement([randomY, randomY1]),
        faker.helpers.arrayElement([randomZ, randomZ1]),
      ];
    };

    const createStars = (stars = 5) => {
      return new Array(stars).fill(undefined).flatMap(createStar);
    };

    return new Float32Array(createStars(4000));
  }, []);

  const [cameraPath, setCameraPath] = useState<any>();

  useEffect(() => {
    if (selected) {
      const radius = 200;
      // const p = new THREE.Vector3(0, 0, radius);
      const p = camera.position;

      const p1 = new THREE.Vector3(selected.x, selected.y, selected.z); // new THREE.Vector3(0, -radius, 0);
      const distanceToPath = radius - p.distanceTo(center);
      const dir = center
        .clone()
        .sub(p1)
        .normalize()
        .multiplyScalar(distanceToPath);
      p1.sub(dir);

      const pointsOnPath = 64;
      const path = [];
      for (let index = 0; index < pointsOnPath; index++) {
        const percent = index * (1 / pointsOnPath);
        const onPath = getPointInBetweenByPerc(p, p1, percent);

        const distanceToPath = radius - onPath.distanceTo(center);
        const dir = center
          .clone()
          .sub(onPath)
          .normalize()
          .multiplyScalar(distanceToPath);
        onPath.sub(dir);

        path.push(onPath);
      }

      cont.current.enabled = false;

      const curve = new THREE.CatmullRomCurve3(path);

      // gsap.to(camera.position, {
      //   duration: 2,
      //   motionPath: {
      //     path: path.map((p: any) => ({ x: p.x, y: p.y, z: p.z })),
      //     resolution: 50
      //   },
      //
      //   ease: "power1.inOut",
      //
      //   onUpdate: () => {
      //     // @ts-ignore
      //     // cont.current.update();
      //     camera.lookAt(center);
      //   },
      // });
      setCameraPath(curve);
    }
  }, [selected]);

  useFrame(() => {
    if (cameraPath) {
      camPosIndex++;
      if (camPosIndex > 50) {
        camPosIndex = 0;
        setCameraPath(null);
        cont.current.enabled = true;
      } else {
        var camPos = cameraPath.getPoint(camPosIndex / 50);
        var camRot = cameraPath.getTangent(camPosIndex / 50);

        camera.position.x = camPos.x;
        camera.position.y = camPos.y;
        camera.position.z = camPos.z;

        camera.rotation.x = camRot.x;
        camera.rotation.y = camRot.y;
        camera.rotation.z = camRot.z;

        camera.lookAt(center);
      }
    }
  });

  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 100, 25]} />
      <OrbitControls maxZoom={0.25} ref={cont} />
      <mesh ref={mesh}>
        {tiles.map((t: any, i: any) => (
          <TileMesh
            selectedTile={selected}
            key={i}
            planetEndQ={planetEndQ}
            {...t}
            index={i}
            onClick={() => {
              onClick(t.centerPoint);
            }}
            raised={t.raised}
            highlighted={poleIds.find((p: string) => p === t.id)}
            selected={
              [selected?.x, selected?.y, selected?.z].join(',') === t.id
            }
            sphereQuat={planetEndQ}
            target={true}
          />
        ))}
        {portal}
        {/*{cameraPath && (*/}
        {/*  <points>*/}
        {/*    <bufferGeometry>*/}
        {/*      <bufferAttribute*/}
        {/*        attach="attributes-position"*/}
        {/*        count={cameraPath.length / 3}*/}
        {/*        itemSize={3}*/}
        {/*        array={cameraPath}*/}
        {/*      />*/}
        {/*    </bufferGeometry>*/}
        {/*    <pointsMaterial size={2} color={'red'} />*/}
        {/*  </points>*/}
        {/*)}*/}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={stars.length / 3}
              itemSize={3}
              array={stars}
            />
          </bufferGeometry>
          <pointsMaterial size={2} color={starColor} transparent />
        </points>
      </mesh>
    </>
  );
}
