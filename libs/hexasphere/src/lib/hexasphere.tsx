import React, { useEffect, useMemo, useRef, useState } from 'react';
import '@react-three/fiber';
// @ts-ignore
import HS from './hexasphere.lib';
import { PointTextHelper } from '@jniac/three-point-text-helper';
import { DirectionalLight, DirectionalLightHelper } from 'three';
import { useHelper } from '@react-three/drei';

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return (n * depthRatio) - n;
}

function TileMesh({ positions, indices, color, raised, onClick }: any) {

  const mesh: any = useRef();
  const [b, setB] = useState<any>(null);
  const [d, setD] = useState<any>(null);

  useEffect(() => {

    const c = Array.from<any>(positions);
    // v5
    c.push(positions[0] - withDepthRatio(positions[0]), positions[1] - withDepthRatio(positions[1]), positions[2] - withDepthRatio(positions[2]));

    // v6
    c.push(positions[3] - withDepthRatio(positions[3]), positions[4] - withDepthRatio(positions[4]), positions[5] - withDepthRatio(positions[5]));

    // v7
    c.push(positions[6] - withDepthRatio(positions[6]), positions[7] - withDepthRatio(positions[7]), positions[8] - withDepthRatio(positions[8]));

    // v8
    c.push(positions[9] - withDepthRatio(positions[9]), positions[10] - withDepthRatio(positions[10]), positions[11] - withDepthRatio(positions[11]));

    // v9
    c.push(positions[12] - withDepthRatio(positions[12]), positions[13] - withDepthRatio(positions[13]), positions[14] - withDepthRatio(positions[14]));

    if (positions.length > 15) {
      // v10
      c.push(positions[15] - withDepthRatio(positions[15]), positions[16] - withDepthRatio(positions[16]), positions[17] - withDepthRatio(positions[17]));
    }

    setB(new Float32Array(c));

  }, [positions]);

  useEffect(() => {

    const z = Array.from<any>(indices);

    // face 1
    z.push(0, 5, 6);
    z.push(0, 6, 1);

    // face 2
    z.push(2, 7, 8);
    z.push(8, 3, 2);

    // face 3
    z.push(1, 6, 7);
    z.push(7, 2, 1);

    // face 4
    z.push(3, 8, 9);
    z.push(9, 4, 3);

    // face 5
    z.push(4, 9, 5);
    z.push(0, 4, 5);

    if (positions.length > 15) {
      // face 6
      z.push(4, 9, 10);

      // face 7
      z.push(4, 10, 11);
      z.push(4, 11, 5);

      // face 8
      z.push(5, 11, 6);
    }

    setD(new Uint16Array(z));

  }, [indices, positions]);

  useEffect(() => {

    // console.log({ b });
    // console.log({ 'positions.length': b?.length });
    // console.log({ d });
    // console.log({ 'indices.length': d?.length });

    // if (mesh.current && b && d) {
    //   const pth = new PointTextHelper();
    //   mesh.current.add(pth);
    //   pth.displayVertices(b, {
    //     color: 'white',
    //     size: 10,
    //     format: (index) => `${index}`
    //   });
    // }
  }, [mesh.current, b, d]);

  useEffect(() => {
    setB((b: any) => {
      const c = [...Array.from<any>(b)];
      return new Float32Array(c)
    });
  }, [raised, positions])

  return (!b || !d) ? null : (
    <mesh ref={mesh} onClick={onClick}>
      <bufferGeometry onUpdate={self => self.computeVertexNormals()}>
        <bufferAttribute
          attach="attributes-position"
          array={b}
          count={b.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={d}
          count={d.length}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial color={color} />
    </mesh>);
}

export function Hexasphere() {

  const [raised, setRaised] = useState<number[]>([])

  const tiles = useMemo(() => {
    // @ts-ignore
    const hexasphere: any = new HS(50, 2, 1);
    const tiles: any = [];

    const raise = (i: number) => raised.some(r => r === i);

    hexasphere.tiles.forEach((t: any, i: number) => {
      const v: any = [];
      t.boundary.forEach((bp: any) => {
        if (raise(i)) {
          console.log(i)
          v.push(parseFloat(bp.x) * depthRatio, parseFloat(bp.y) * depthRatio, parseFloat(bp.z) * depthRatio);
        } else {
          v.push(parseFloat(bp.x), parseFloat(bp.y), parseFloat(bp.z));
        }
      });

      const positions = new Float32Array(v);

      const indices = [];

      indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);

      if (positions.length > 15) {
        indices.push(0, 4, 5);
      }

      tiles.push({
        positions,
        indices: new Uint16Array(indices),
        color: raise(i) ? 'green' : 'blue',
        raised: raise(i)
      });
    });


    return tiles;
  }, [raised]);

  const dirLight = useRef<DirectionalLight>(null);
  useHelper(dirLight, DirectionalLightHelper, 1, 'red');

  function onClick(i: number) {
    setRaised((prev: number[]) => {
      const newPrev = [...prev];
      newPrev.push(i);
      return newPrev;
    })
  }

  return (
    <>
      <ambientLight />
      <directionalLight ref={dirLight} castShadow={true} position={[0, 100, 25]} />
      <mesh onUpdate={(self) => self.matrixWorldNeedsUpdate = true}>
        {tiles.map((t: any, i: any) => <TileMesh key={i} {...t} onClick={() => onClick(i)} />)}
      </mesh>
    </>
  );
}
