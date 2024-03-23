import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import { useFrame } from '@react-three/fiber';
import { PortalPath } from '@end/components';
import * as THREE from 'three';

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
      <mesh ref={mesh} onClick={onClick}>
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
  rotateX,
  rotateY,
  rotateZ,
  tiles,
  hexasphere,
  selected,
  setSelected,
}: {
  setSelected(id: { x: number; y: number; z: number }): void;
  selected?: { x: number; y: number; z: number };
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

  function onClick(id: { x: number; y: number; z: number }) {
    setSelected(id);
    const stringId = [id.x, id.y, id.z].join(',');
    setHighlighted(
      hexasphere.tileLookup[stringId].neighborIds.filter((id: string) =>
        tiles.some(
          (t: { id: string; raised: boolean }) => t.raised && t.id === id
        )
      )
    );
  }

  const mesh: any = useRef();
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = THREE.MathUtils.degToRad(rotateX * 360);
      mesh.current.rotation.y = THREE.MathUtils.degToRad(rotateY * 360);
      mesh.current.rotation.z = THREE.MathUtils.degToRad(rotateZ * 360);
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

  const [from, to] = useMemo(() => {
    const from = faker.number.int({ min: 0, max: 161 });
    var to = faker.number.int({ min: 0, max: 161 });

    while (from === to) {
      to = faker.number.int({ min: 0, max: 161 });
    }

    return [from, to];
  }, []);

  console.log(selected && [selected.x, selected.y, selected.z].join(','));

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
              console.log(i);
              onClick(t.centerPoint);
            }}
            highlighted={highlighted.some((h) => h === t.id)}
            selected={
              selected
                ? [selected.x, selected.y, selected.z].join(',') === t.id
                : false
            }
            target={true}
          />
        ))}
        <PortalPath from={tiles[from].centerPoint} to={tiles[to].centerPoint} />
      </mesh>
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
    </>
  );
}
