import React, { useMemo, useState } from 'react';
import '@react-three/fiber';
// @ts-ignore
import HS from './hexasphere.lib';

function TileMesh({ positions, indices }: any) {
  const [color, changeColor] = useState();
  console.log(indices);

  return (<mesh>
    <bufferGeometry>
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
    <meshStandardMaterial color={'blue'} />
  </mesh>);
}

export function Hexasphere() {

  const tiles = useMemo(() => {
    // @ts-ignore
    const hexasphere: any = new HS(50, 2, 0.95);
    const tiles: any = [];

    hexasphere.tiles.forEach((t: any) => {
      const v: any = [];
      t.boundary.forEach((bp: any) => {
        v.push(parseFloat(bp.x), parseFloat(bp.y), parseFloat(bp.z));
      });

      const positions = new Float32Array(v);

      const i = [];
      i.push(0, 1, 2, 0, 2, 3, 0, 3, 4);
      if (positions.length > 15) {
        i.push(0, 4, 5);
      }

      const indices = new Uint16Array(i);
      tiles.push({ positions, indices });
    });


    return tiles;
  }, []);


  return (<>
    {tiles.map((t: any, i: any) => <TileMesh key={i} positions={t.positions} indices={t.indices} />)}
  </>);
}
