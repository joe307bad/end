import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import { useFrame, useThree, extend, Object3DNode } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
// @ts-ignore
import tf from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { MathUtils, Vector3 } from 'three';

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

  useLayoutEffect(() => {
    if (geo.current) {
      geo.current.attributes.position.needsUpdate = true;
    }
  }, [positions]);

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

  const randomNumber = useMemo(
    () => faker.number.int({ min: 1, max: 9 }).toString(),
    []
  );

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
    </>
  );
}

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

  useEffect(() => {
    if (selected && mesh.current) {
      const startQ = mesh.current?.quaternion.clone().normalize();
      const endQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(selected.x, selected.y, selected.z).normalize(),
        camera.position.clone().normalize()
      );
      const t = { q: 0 };

      gsap.to(t, {
        duration: 1,
        q: 1,
        onUpdate(q, b, c) {
          let inBetween = startQ.slerp(endQ, t.q);
          mesh.current?.setRotationFromQuaternion(inBetween);
        },
      });
    }
  }, [selected, camera.position]);

  useFrame(({ clock }) => {
    // console.log(clock.getElapsedTime())
    if (!selected && mesh.current) {
      mesh.current.rotation.y += 0.003;
    }
  });

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
      <mesh ref={mesh}>
        {tiles.map((t: any, i: any) => (
          <TileMesh
            key={i}
            {...t}
            index={i}
            onClick={() => {
              onClick(t.centerPoint);
            }}
            raised={t.raised}
            highlighted={highlighted.some((h) => h === t.id)}
            selected={
              [selected?.x, selected?.y, selected?.z].join(',') === t.id
            }
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
