import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import '@react-three/fiber';
// @ts-ignore
import HS from './hexasphere.lib';
import { PointTextHelper } from '@jniac/three-point-text-helper';
import { faker } from '@faker-js/faker';
import { useFrame } from '@react-three/fiber';

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return (n * depthRatio) - n;
}

function TileMesh({ positions, indices, color, onClick, target, highlighted }: any) {

  const mesh: any = useRef();
  const geo: any = useRef();

  useLayoutEffect(() => {
    if (geo.current) {
      geo.current.attributes.position.needsUpdate = true;
    }
  }, [positions]);

  useEffect(() => {

    // console.log({ b });
    // console.log({ 'positions.length': b?.length });
    // console.log({ d });
    // console.log({ 'indices.length': d?.length });

    if (mesh.current) {
      const pth = new PointTextHelper();
      mesh.current.add(pth);
      // pth.displayVertices(positions, {
      //   color: 'white',
      //   size: 10,
      //   format: (index) => `${index}`
      // });
    }
  }, [mesh.current]);

  return !target ? null : (
    <mesh ref={mesh} onClick={onClick}>
      <bufferGeometry ref={geo} onUpdate={self => self.computeVertexNormals()}>
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
      <meshStandardMaterial color={highlighted ? 'red' : color} />
    </mesh>);
}

const hexasphere = new HS(50, 4, 1);

export function Hexasphere() {

  const [raised, setRaised] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const seed = useMemo(() => faker.number.int({ min: 2, max: 12 }), []);
  const seed1 = useMemo(() => faker.number.int({ min: 2, max: 12 }), []);

  const tiles = useMemo(() => {
    // @ts-ignore
    const tiles: any = [];

    const raise = (i: number) => i % seed === 0 || i % seed1 === 0;

    hexasphere.tiles.forEach((t: any, i: number) => {

      const v: any = [];
      t.boundary.forEach((bp: any) => {
        if (raise(i)) {
          v.push(parseFloat(bp.x) * depthRatio, parseFloat(bp.y) * depthRatio, parseFloat(bp.z) * depthRatio);
        } else {
          v.push(parseFloat(bp.x), parseFloat(bp.y), parseFloat(bp.z));
        }
      });

      // v6
      v.push(v[0] - withDepthRatio(v[0]), v[1] - withDepthRatio(v[1]), v[2] - withDepthRatio(v[2]));

      // v7
      v.push(v[3] - withDepthRatio(v[3]), v[4] - withDepthRatio(v[4]), v[5] - withDepthRatio(v[5]));

      // v8
      v.push(v[6] - withDepthRatio(v[6]), v[7] - withDepthRatio(v[7]), v[8] - withDepthRatio(v[8]));

      // v9
      v.push(v[9] - withDepthRatio(v[9]), v[10] - withDepthRatio(v[10]), v[11] - withDepthRatio(v[11]));

      // v10
      v.push(v[12] - withDepthRatio(v[12]), v[13] - withDepthRatio(v[13]), v[14] - withDepthRatio(v[14]));


      // v11
      v.push(v[15] - withDepthRatio(v[15]), v[16] - withDepthRatio(v[16]), v[17] - withDepthRatio(v[17]));


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
        color: raise(i) ? 'green' : 'blue',
        raised: raise(i),
        id
      });
    });

    return tiles;
  }, [raised, hexasphere]);

  // const dirLight = useRef<DirectionalLight>(null);
  // useHelper(dirLight, DirectionalLightHelper, 1, 'red');

  function onClick(i: number, id: string) {

    setHighlighted(hexasphere.tileLookup[id].neighborIds);

    setRaised((prev: number[]) => {
      const newPrev = [...prev];
      newPrev.push(i);
      return newPrev;
    });
  }


  const mesh: any = useRef();
  useFrame(() => {
    if (mesh.current && highlighted.length === 0) {
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


      return [faker.helpers.arrayElement([randomX, randomX1]), faker.helpers.arrayElement([randomY, randomY1]), faker.helpers.arrayElement([randomZ, randomZ1])];
    };

    const createStars = (stars = 5) => {
      return new Array(stars)
        .fill(undefined)
        .flatMap(createStar);
    };

    return new Float32Array(createStars(4000));
  }, []);

  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 100, 25]} />
      <mesh ref={mesh} onUpdate={(self) => self.matrixWorldNeedsUpdate = true}>
        {tiles.map((t: any, i: any) => <TileMesh key={i} {...t} index={i}
                                                 onClick={() => onClick(i, t.id)}
                                                 highlighted={highlighted.some(h => h === t.id)}
                                                 target={true} />)}
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
        <pointsMaterial
          size={2}
          color={'white'}
          transparent
        />
      </points>
    </>
  );
}
