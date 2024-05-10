import React, {
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
    if (text.current) {
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
  getPointInBetweenByPerc,
}: {
  setSelected(id: { x: number; y: number; z: number }): void;
  selected?: { x: number; y: number; z: number };
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  tiles: any;
  hexasphere: any;
  portal?: any;
  getPointInBetweenByPerc: any;
}) {
  const { camera } = useThree();

  function onClick(id: { x: number; y: number; z: number }) {
    setSelected(id);
  }

  const mesh: any = useRef();
  const [planetEndQ, setPlanetEndQ] = useState<any>();

  const cont: any = useRef();

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
    }
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

  const [cameraPath, setCameraPath] = useState<THREE.CatmullRomCurve3>();
  const [cameraPathPoints, setCameraPathPoints] = useState<Float32Array>();

  const points = useRef<any>();

  useEffect(() => {
    //0,-26.286555473703764,42.5325404993388
    //0,26.286555473703764,-42.5325404993388

    function buildPath(point1: THREE.Vector3, point2: THREE.Vector3) {
      const pointsOnPath = 64;
      const radius = 160;

      function _getPoints(_point1: THREE.Vector3, _point2: THREE.Vector3) {
        const path = [];
        for (let index = 0; index < pointsOnPath; index++) {
          const percent = index * (1 / pointsOnPath);
          const onPath = getPointInBetweenByPerc(_point1, _point2, percent);

          const distanceToPath = radius - onPath.distanceTo(center);
          const dir = center
            .clone()
            .sub(onPath)
            .normalize()
            .multiplyScalar(distanceToPath);
          onPath.sub(dir);

          path.push(onPath);
        }
        return path;
      }

      function _getHalfwayPoint(
        _point1: THREE.Vector3,
        _point2: THREE.Vector3
      ) {
        const onPath = getPointInBetweenByPerc(_point1, _point2, 0.5);
        const distanceToPath = radius - onPath.distanceTo(center);

        // move point away from overlapping poles
        const dir = center
          .clone()
          .sub(camera.position)
          .normalize()
          .multiplyScalar(10);
        onPath.sub(dir).applyEuler(new THREE.Euler(0, 0, Math.PI / 2));

        // move point to the path of the camera
        const dir1 = center
          .clone()
          .sub(onPath)
          .normalize()
          .multiplyScalar(distanceToPath);
        onPath.sub(dir1);

        return onPath;
      }

      let points = new THREE.CatmullRomCurve3(
        _getPoints(point1, point2)
      ).getSpacedPoints(1000);

      if (point1.distanceTo(point2) > 200) {
        points = [
          ...new THREE.CatmullRomCurve3(
            _getPoints(point1, new THREE.Vector3(radius, 0, 0))
          ).getSpacedPoints(1000),
          ...new THREE.CatmullRomCurve3(
            _getPoints(new THREE.Vector3(radius, 0, 0), point2)
          ).getSpacedPoints(1000),
        ];
      }

      const crossingOverPole = (): undefined | THREE.Vector3 => {
        let crossingOverPole = false;
        let closeArray = null;
        points.forEach((point: THREE.Vector3) => {
          const poles = [
            new THREE.Vector3(0, -radius, 0),
            new THREE.Vector3(0, radius, 0),
          ];
          const close = poles.filter((p) => point.distanceTo(p) < 10);
          if (close.length > 0) {
            closeArray = close;
            crossingOverPole = true;
          }
        });
        return closeArray?.[0];
      };

      const pole = crossingOverPole();

      if (pole) {
        const middle = pole.clone();
        const dir = pole.clone().sub(center).normalize().multiplyScalar(10);
        middle
          .add(dir)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), MathUtils.degToRad(10));

        points = [
          ...new THREE.CatmullRomCurve3(
            _getPoints(point1, middle)
          ).getSpacedPoints(1000),
          ...new THREE.CatmullRomCurve3(
            _getPoints(middle, point2)
          ).getSpacedPoints(1000),
        ];
      }

      // setCameraPathPoints(
      //   new Float32Array(
      //     points
      //       .map((point: THREE.Vector3) => [point.x, point.y, point.z])
      //       .flatMap((x) => x)
      //   )
      // );

      const curve = new THREE.CatmullRomCurve3(
        new THREE.CatmullRomCurve3(points).getSpacedPoints(1000)
      );

      setCameraPath(curve);
    }

    if (selected) {
      buildPath(
        camera.position,
        new THREE.Vector3(selected.x, selected.y, selected.z)
        // new THREE.Vector3(0, -26.286555473703764, 42.5325404993388),
        // new THREE.Vector3(0, 26.286555473703764, -42.5325404993388)
      );
    }
  }, [selected]);

  useFrame(() => {
    // if(false) {
    if (cameraPath) {
      camPosIndex++;
      if (camPosIndex > 100) {
        camPosIndex = 0;
        setCameraPath(undefined);
        cont.current.enabled = true;
      } else {
        var camPos = cameraPath.getPoint(camPosIndex / 100);
        var camRot = cameraPath.getTangent(camPosIndex / 100);

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

  const b = useMemo(() => new Float32Array([0, 0, 0]), []);

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
        {cameraPathPoints && (
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={cameraPathPoints.length / 3}
                itemSize={3}
                array={cameraPathPoints}
              />
            </bufferGeometry>
            <pointsMaterial size={5} color={'white'} />
          </points>
        )}
        {
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={b.length / 3}
                itemSize={3}
                array={b}
              />
            </bufferGeometry>
            <pointsMaterial size={5} color={'red'} />
          </points>
        }
        {/*<points>*/}
        {/*  <bufferGeometry>*/}
        {/*    <bufferAttribute*/}
        {/*      attach="attributes-position"*/}
        {/*      count={stars.length / 3}*/}
        {/*      itemSize={3}*/}
        {/*      array={stars}*/}
        {/*    />*/}
        {/*  </bufferGeometry>*/}
        {/*  <pointsMaterial size={2} color={starColor} transparent />*/}
        {/*</points>*/}
      </mesh>
    </>
  );
}
