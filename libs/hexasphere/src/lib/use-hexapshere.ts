import { useMemo, useState } from 'react';
import { HS } from '@end/hexasphere';
import { faker } from '@faker-js/faker';

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return n * depthRatio - n;
}

export function useHexasphere() {
  const hexasphere = useMemo(() => new HS(50, 4, 1), []);
  const [reset, setReset] = useState(Math.random());
  const land = useMemo(() => faker.color.rgb({ format: 'hex' }), [reset]);
  const water = useMemo(() => faker.color.rgb({ format: 'hex' }), [reset]);
  const seed = useMemo(() => faker.number.int({ min: 2, max: 12 }), [reset]);
  const seed1 = useMemo(() => faker.number.int({ min: 2, max: 12 }), [reset]);

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
  }, [hexasphere, reset]);

  return { tiles, hexasphere, setReset, reset };
}