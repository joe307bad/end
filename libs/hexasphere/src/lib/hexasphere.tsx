import React, { useEffect, useMemo, useRef, useState } from 'react';
import '@react-three/fiber';
// @ts-ignore
import HS from './hexasphere.lib';
import { PointTextHelper } from '@jniac/three-point-text-helper';

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return (n * depthRatio) - n;
}

function TileMesh({ positions, indices, color, target }: any) {

  const mesh: any = useRef();
  const [b, setB] = useState<any>(null);
  const [d, setD] = useState<any>(null);

  useEffect(() => {

    const c = Array.from<any>(positions);
    // v5
    c.push(positions[0] - withDepthRatio(positions[0]), positions[1] - withDepthRatio(positions[1]), positions[2] - withDepthRatio(positions[2]));

    // v6
    c.push(positions[3] - withDepthRatio(positions[3]), positions[4] - withDepthRatio(positions[4]), positions[5] - withDepthRatio(positions[5]));

    setB(new Float32Array(c));

  }, [positions]);

  useEffect(() => {

    const z = Array.from<any>(indices);

    // face 1
    z.push(0, 5, 6);
    z.push(0, 6, 1);

    setD(new Uint16Array(z));

  }, [indices]);

  useEffect(() => {

    console.log({ b });
    console.log({ 'positions.length': b?.length });
    console.log({ d });
    console.log({ 'indices.length': d?.length });

    if (mesh.current && b && d) {
      const pth = new PointTextHelper();
      mesh.current.add(pth);
      pth.displayVertices(b, {
        color: 'white',
        size: 10,
        format: (index) => `${index}`
      });
    }
  }, [mesh.current, b, d]);

  return (!target || !b || !d) ? null : (
    <mesh ref={mesh}>
      <bufferGeometry>
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

  const tiles = useMemo(() => {
    // @ts-ignore
    const hexasphere: any = new HS(50, 2, 1);
    const tiles: any = [];

    hexasphere.tiles.forEach((t: any, i: number) => {
      const v: any = [];
      t.boundary.forEach((bp: any) => {
        if (i === 0) {
          v.push(parseFloat(bp.x) * depthRatio, parseFloat(bp.y) * depthRatio, parseFloat(bp.z) * depthRatio);
        } else {
          v.push(parseFloat(bp.x), parseFloat(bp.y), parseFloat(bp.z));
        }
      });

      const positions = new Float32Array(v);

      const indices = [];


      if (i === 0) {
        indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);
      } else {
        indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);
      }


      if (positions.length > 15) {
        indices.push(0, 4, 5);
      }

      if (i === 0) {
        // indices.push(7, 8, 9, 7, 9, 10, 7, 10, 11);
      }

      tiles.push({ positions, indices: new Uint16Array(indices), color: i === 0 ? 'green' : 'blue', target: i === 0 });
    });


    return tiles;
  }, []);


  return (<>
    {tiles.map((t: any, i: any) => <TileMesh key={i} {...t} />)}
  </>);
}
