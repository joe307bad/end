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
      <mesh ref={cube}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  );
}

const poleIds = ['0,-50,0', '0,50,0'];

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
      const s = new THREE.Vector3(selected.x, selected.y, selected.z);
      const dir = s.clone().sub(center).normalize().multiplyScalar(100);
      s.add(dir);

      var tl = gsap.timeline();

      // console.log(selected);

      const selectedId = `${selected.x},${selected.y},${selected.z}`;
      const enteringPole = poleIds.some((p: string) => p === selectedId);
      const exitingPole = poleIds.some((p: string) => p === curX);
      const existingNeighbor = [...pole1, ...pole2].some((p: string) => p === curX);

      const closest1 = pole1.sort((a: string, b: string) => {
        const [x, y, z] = a.split(',').map((x) => Number(x));
        const [x1, y1, z1] = b.split(',').map((x) => Number(x));
        const av = new THREE.Vector3(x, y, z);
        const bv = new THREE.Vector3(x1, y1, z1);
        const p = new THREE.Vector3(0, 0, 50);

        return av.distanceTo(p) > bv.distanceTo(p);
      })[0];

      const closest2 = pole2.sort((a: string, b: string) => {
        const [x, y, z] = a.split(',').map((x) => Number(x));
        const [x1, y1, z1] = b.split(',').map((x) => Number(x));
        const av = new THREE.Vector3(x, y, z);
        const bv = new THREE.Vector3(x1, y1, z1);
        const p = new THREE.Vector3(0, 0, 50);

        return av.distanceTo(p) > bv.distanceTo(p);
      })[5];

      console.log(closest1, closest2)

      const point = (() => {
        // const [x, y, z] = (selectedId === poleIds[0] ? closest1 : closest2)
        //   .split(',')
        //   .map((x: any) => Number(x));
        // TODO this is hardcoded for pole1, get pole2 "safe tile"
        const x =  -0;
        const y = 42.532540386381314
        const z = 26.2865556564728
        const s1 = new THREE.Vector3(x, y, z);
        const dir = s1.clone().sub(center).normalize().multiplyScalar(100);
        s1.add(dir);

        return s1;
      })();

      console.log(selected);

      if (enteringPole || exitingPole || existingNeighbor) {
        // TODO allow for going from pole neighbor to pole neiGhbor without intermediate step
        tl.to(camera.position, {
          duration: 0.25,
          x: point.x,
          y: point.y,
          z: point.z,
          onUpdate(q, b, c) {
            cont.current.update();
          },
          onComplete() {},
        });
      }

      setCurX(selectedId);

      // TODO prevent from going through planet, probably with another intermediate step like above
      tl.to(camera.position, {
        duration: 0.25,
        x: s.x,
        y: s.y,
        z: s.z,
        // delay: 1,
        onUpdate(q, b, c) {
          cont.current.update();
        },
        onComplete() {},
      });
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
