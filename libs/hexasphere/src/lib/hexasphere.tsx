import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
// @ts-ignore
import HS from './hexasphere.lib';
import { faker } from '@faker-js/faker';
import { useFrame } from '@react-three/fiber';
import { PortalPath } from '@end/components';
import * as THREE from 'three';
import { useWindowDimensions } from 'react-native';

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return n * depthRatio - n;
}

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

const hexasphere = new HS(50, 4, 1);

export function Hexasphere() {
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const seed = useMemo(() => faker.number.int({ min: 2, max: 12 }), []);
  const seed1 = useMemo(() => faker.number.int({ min: 2, max: 12 }), []);
  const land = useMemo(() => faker.color.rgb({ format: 'hex' }), []);
  const water = useMemo(() => faker.color.rgb({ format: 'hex' }), []);
  const starColor = useMemo(() => faker.color.rgb({ format: 'hex' }), []);
  const [selected, setSelected] = useState<string>();

  const tiles = useMemo(() => {
    // @ts-ignore
    const tiles: any = [];

    const raise = (i: number) => i % seed === 0 || i % seed1 === 0;

    hexasphere.tiles.forEach((t: any, i: number) => {
      const v: any = [];
      t.boundary.forEach((bp: any) => {
        if (raise(i)) {
          v.push(
            parseFloat(bp.x) * depthRatio,
            parseFloat(bp.y) * depthRatio,
            parseFloat(bp.z) * depthRatio
          );
        } else {
          v.push(parseFloat(bp.x), parseFloat(bp.y), parseFloat(bp.z));
        }
      });

      // v6
      v.push(
        v[0] - withDepthRatio(v[0]),
        v[1] - withDepthRatio(v[1]),
        v[2] - withDepthRatio(v[2])
      );

      // v7
      v.push(
        v[3] - withDepthRatio(v[3]),
        v[4] - withDepthRatio(v[4]),
        v[5] - withDepthRatio(v[5])
      );

      // v8
      v.push(
        v[6] - withDepthRatio(v[6]),
        v[7] - withDepthRatio(v[7]),
        v[8] - withDepthRatio(v[8])
      );

      // v9
      v.push(
        v[9] - withDepthRatio(v[9]),
        v[10] - withDepthRatio(v[10]),
        v[11] - withDepthRatio(v[11])
      );

      // v10
      v.push(
        v[12] - withDepthRatio(v[12]),
        v[13] - withDepthRatio(v[13]),
        v[14] - withDepthRatio(v[14])
      );

      // v11
      v.push(
        v[15] - withDepthRatio(v[15]),
        v[16] - withDepthRatio(v[16]),
        v[17] - withDepthRatio(v[17])
      );

      const positions = new Float32Array(v);

      const indices = [];

      indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);

      // face 1
      indices.push(0, 5, 6);
      indices.push(0, 6, 1);

      // face 2
      indices.push(2, 7, 8);
      indices.push(8, 3, 2);

      // face 3
      indices.push(1, 6, 7);
      indices.push(7, 2, 1);

      // face 4
      indices.push(3, 8, 9);
      indices.push(9, 4, 3);

      // face 5
      indices.push(4, 5, 0);

      if (positions.length > 33) {
        // face 6
        indices.push(4, 9, 10);

        // face 7
        indices.push(4, 10, 11);
        indices.push(4, 11, 5);

        // face 8
        indices.push(5, 11, 6);
      } else {
        indices.push(4, 9, 5);
      }

      const { x, y, z } = t.centerPoint;
      const id = `${x},${y},${z}`;

      tiles.push({
        positions,
        indices: new Uint16Array(indices),
        color: raise(i) ? land : water,
        raised: raise(i),
        centerPoint: t.centerPoint,
        id,
      });
    });

    return tiles;
  }, [hexasphere]);

  // const dirLight = useRef<DirectionalLight>(null);
  // useHelper(dirLight, DirectionalLightHelper, 1, 'red');

  function onClick(i: number, id: string) {
    setSelected(id);
    setHighlighted(
      hexasphere.tileLookup[id].neighborIds.filter((id: string) =>
        tiles.some(
          (t: { id: string; raised: boolean }) => t.raised && t.id === id
        )
      )
    );
  }

  const mesh: any = useRef();
  useFrame(() => {
    if (mesh.current && highlighted.length === 0 && !selected) {
      mesh.current.rotation.z += 0.005;
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
              onClick(i, t.id);
            }}
            highlighted={highlighted.some((h) => h === t.id)}
            selected={selected === t.id}
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
