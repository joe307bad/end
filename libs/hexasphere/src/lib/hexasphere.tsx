import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import { useFrame, useThree } from '@react-three/fiber';
import { PortalPath } from '@end/components';
import * as THREE from 'three';
import { MathUtils } from 'three';
import gsap from 'gsap';

function TileMesh({
  positions,
  indices,
  color,
  onClick,
  target,
  highlighted,
  selected,
}: any) {
  const mesh: any = useRef();
  const geo: any = useRef();
  const [edges, setEdges] = useState<any>();

  useLayoutEffect(() => {
    if (geo.current) {
      geo.current.attributes.position.needsUpdate = true;
    }
  }, [positions]);

  useEffect(() => {
    if (geo.current) {
      setEdges([
        new THREE.EdgesGeometry(geo.current, 50),
        new THREE.LineBasicMaterial({ color: 'black', linewidth: 10 }),
      ]);
      // const pth = new PointTextHelper();
      // mesh.current.add(pth);
      // pth.displayVertices(positions, {
      //   color: 'white',
      //   size: 10,
      //   format: (index) => `${index}`,
      // });
    }
  }, [geo.current]);

  return !target ? null : (
    <>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <bufferGeometry
          ref={geo}
          onUpdate={(self) => self.computeVertexNormals()}
        >
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
  selected1,
}: {
  setSelected(id: { x: number; y: number; z: number }): void;
  selected?: { x: number; y: number; z: number };
  setSelected1(id: { x: number; y: number; z: number } | null): void;
  selected1?: { x: number; y: number; z: number } | null;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  tiles: any;
  hexasphere: any;
}) {
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const starColor = useMemo(() => faker.color.rgb({ format: 'hex' }), []);

  // const dirLight = useRef<DirectionalLight>(null);
  // useHelper(dirLight, DirectionalLightHelper, 1, 'red');
  const { camera } = useThree();

  function onClick(id: { x: number; y: number; z: number }) {
    setSelected(id);
    console.log(id);
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

  const [from, to] = useMemo(() => {
    const from = faker.number.int({ min: 0, max: 161 });
    var to = faker.number.int({ min: 0, max: 161 });

    while (from === to) {
      to = faker.number.int({ min: 0, max: 161 });
    }

    return [from, to];
  }, []);

  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 100, 25]} />
      <mesh
        ref={mesh}
        onUpdate={(self) => (self.matrixWorldNeedsUpdate = true)}
      >
        {tiles.map((t: any, i: any) => (
          <TileMesh
            key={i}
            {...t}
            index={i}
            onClick={() => {
              onClick(t.centerPoint);
            }}
            highlighted={highlighted.some((h) => h === t.id)}
            selected={
              [selected?.x, selected?.y, selected?.z].join(',') === t.id ||
              [selected1?.x, selected1?.y, selected1?.z].join(',') === t.id
            }
            target={true}
          />
        ))}
        {/*<PortalPath from={tiles[from].centerPoint} to={tiles[to].centerPoint} />*/}
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
