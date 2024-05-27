import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import {
  extend,
  Object3DNode,
  ThreeEvent,
  useFrame,
  useThree,
} from '@react-three/fiber';
import * as THREE from 'three';
import { BufferAttribute, MathUtils, NormalBufferAttributes } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
// @ts-ignore
import tf from 'three/examples/fonts/helvetiker_regular.typeface.json';

import { proxy, useSnapshot } from 'valtio';
import { derive, subscribeKey } from 'valtio/utils';
// @ts-ignore
import HS from './hexasphere.lib';
import { buildCameraPath } from './build-camera-path';
import { Edges } from '@react-three/drei';

extend({ TextGeometry });

const center = new THREE.Vector3(0, 0, 0);

const font = new FontLoader().parse(tf);
declare module '@react-three/fiber' {
  interface ThreeElements {
    textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
  }
}

const depthRatio = 1.04;

function withDepthRatio(n: number) {
  return n * depthRatio - n;
}

export type Coords = {
  x: number;
  y: number;
  z: number;
};

type Face = {
  id: number;
  centroid: Coords;
  points: ({ faces: Face[] } & Coords)[];
};

export type Tile = {
  boundary: Coords[];
  centerPoint: { faces: Face[] } & Coords;
  faces: Face[];
  neighborIds: string[];
  neighbors: Tile[];
  raised?: boolean;
} & LandAndWater;

export type RenderedTile = {
  positions: Float32Array;
  indices: Uint16Array;
  color: string;
  raised: boolean;
  centerPoint: { faces: Face[] } & Coords;
  neighbors: Tile[];
  id: string;
};

export type THexasphere = {
  radius: number;
  tiles: Tile[];
  tileLookup: Record<string, Tile>;
};

export const hexasphere: THexasphere = new HS(50, 4, 1);

function getBoundaries(t: Tile, raised: boolean) {
  const v: number[] = [];

  t.boundary.forEach((bp) => {
    if (raised) {
      v.push(
        parseFloat(bp.x.toString()) * depthRatio,
        parseFloat(bp.y.toString()) * depthRatio,
        parseFloat(bp.z.toString()) * depthRatio
      );
    } else {
      v.push(
        parseFloat(bp.x.toString()),
        parseFloat(bp.y.toString()),
        parseFloat(bp.z.toString())
      );
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

  return { indices: new Uint16Array(indices), positions };
}

export const hexasphereProxy = proxy<{
  selection: {
    selectedId: string | null;
    cameraPosition: THREE.Vector3 | null;
  };
  tiles: {
    id: string;
    selected: boolean;
    defending: boolean;
    raised: boolean;
    name: string;
  }[];
}>({
  selection: {
    selectedId: null,
    cameraPosition: null,
  },
  tiles: Object.keys(hexasphere.tileLookup).map((tileId: string) => {
    const perctRaised = faker.number.float({ min: 0.1, max: 0.9 });
    const raised = faker.datatype.boolean(perctRaised);
    const name = faker.lorem.word();
    const tile = hexasphere.tileLookup[tileId];
    // const
    return {
      id: tileId,
      selected: false,
      defending: false,
      raised,
      name,
    };
  }),
});

Object.keys(hexasphere.tileLookup).forEach((tileId) => {
  const tile = hexasphere.tileLookup[tileId];
  const land = getBoundaries(tile, true);
  const water = getBoundaries(tile, false);
  hexasphere.tileLookup[tileId].land = land;
  hexasphere.tileLookup[tileId].water = water;

  const geometry = new THREE.BufferGeometry();

  const vertices = land.positions;

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('index', new THREE.BufferAttribute(land.indices, 1));

  hexasphere.tileLookup[tileId].landGeometry = geometry;
});

export function selectTile(id: string, cameraPosition: THREE.Vector3) {
  const currentlySelected = hexasphereProxy.tiles.find((tile) => tile.selected);

  if (currentlySelected) {
    currentlySelected.selected = false;
  }

  const newSelected = hexasphereProxy.tiles.find((tile) => tile.id === id);

  if (newSelected) {
    newSelected.selected = true;
    hexasphereProxy.selection.selectedId = newSelected.id;
    hexasphereProxy.selection.cameraPosition = cameraPosition;

    const currentlyDefending = hexasphereProxy.tiles.filter(
      (tile) => tile.defending
    );

    if (currentlyDefending.length > 0) {
      currentlyDefending.forEach((tile) => {
        tile.defending = false;
      });
    }

    const neighbors = hexasphere.tileLookup[newSelected.id].neighborIds;

    newSelected.raised &&
      neighbors.forEach((neighborTileId) => {
        const neighbor = hexasphereProxy.tiles.find(
          (tile) => tile.id === neighborTileId
        );
        if (neighbor) {
          neighbor.defending = true;
        }
      });
  }

  return currentlySelected;
}

export const derived = derive({
  cameraPath: (get) => {
    const selectedId = get(hexasphereProxy.selection).selectedId;
    const cameraPosition = get(hexasphereProxy.selection).cameraPosition;
    if (selectedId && cameraPosition) {
      const { x, y, z } = hexasphere.tileLookup[selectedId].centerPoint;
      return buildCameraPath(cameraPosition, new THREE.Vector3(x, y, z));
    }

    return undefined;
  },
  selectedTileIndex: (get) => {
    const selectedId = get(hexasphereProxy.selection).selectedId;
    return hexasphereProxy.tiles
      .filter((t) => t.raised)
      .findIndex((t) => t.id === selectedId);
  },
});

const TroopCount = React.memo(
  ({
    x,
    y,
    z,
    selected,
    defending,
  }: {
    x: number;
    y: number;
    z: number;
    selected: boolean;
    defending: boolean;
  }) => {
    const countGeo: React.MutableRefObject<THREE.CylinderGeometry | null> =
      useRef(null);
    const text: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    const textMesh: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    const textGeo: React.MutableRefObject<TextGeometry | null> = useRef(null);
    const selectedRing: React.MutableRefObject<THREE.Mesh | null> =
      useRef(null);
    const defendingRing: React.MutableRefObject<THREE.Mesh | null> =
      useRef(null);
    const cyl: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    useEffect(() => {
      if (selectedRing.current) {
        selectedRing.current.rotation.x = MathUtils.degToRad(-90);
      }
      if (defendingRing.current) {
        defendingRing.current.rotation.x = MathUtils.degToRad(-90);
      }
    }, [selected, defending]);

    const randomNumber = useMemo(
      () => faker.number.int({ min: 1, max: 9999 }).toString(),
      []
    );

    useEffect(() => {
      if (
        countGeo.current &&
        text.current &&
        cyl.current &&
        textGeo.current &&
        textMesh.current
      ) {
        if (parseInt(randomNumber) > 99) {
          cyl.current.scale.x = 1.5;
        }
        if (parseInt(randomNumber) > 999) {
          cyl.current.scale.x = 2;
        }

        const cp = new THREE.Vector3(x, y, z);

        cyl.current.rotation.x = MathUtils.degToRad(90);
        text.current?.position.copy(center.clone());
        text.current?.lookAt(cp.clone());
        text.current?.position.copy(cp.clone());

        textGeo.current.computeBoundingBox();
        const b = textGeo.current.boundingBox?.getCenter(new THREE.Vector3());

        if (b) {
          textMesh.current.position.x -= b.x;
          textMesh.current.position.y -= b.y;
          textMesh.current.position.z += 1;
        }
      }
    }, []);
    const { camera } = useThree();

    useFrame(() => {
      if (text.current) {
        const b = text.current.position.clone();
        const a = new THREE.Object3D();
        a.position.set(b.x, b.y, b.z);
        a.lookAt(camera.position);

        const z = a.rotation.z;
        const cp = new THREE.Vector3(x, y, z);

        const dir1 = cp.clone().sub(center).normalize().multiplyScalar(10);
        cp.add(dir1);

        text.current.rotation.z = z;
      }
    });

    return (
      <mesh ref={text} position={[x, y, z]}>
        <mesh ref={cyl}>
          <cylinderGeometry
            ref={countGeo}
            attach="geometry"
            args={[2, 2, 2, 35]}
          />
          <Edges color={selected ? 'yellow' : 'black'} threshold={50} />
          {selected ? (
            <mesh ref={selectedRing} position={[0, 1, 0]}>
              <ringGeometry args={[2, 2.5, 25]} />
              <meshBasicMaterial
                side={THREE.DoubleSide}
                attach="material"
                color={'red'}
              />
            </mesh>
          ) : null}
          {defending ? (
            <mesh ref={defendingRing} position={[0, 1, 0]}>
              <ringGeometry args={[2, 2.5, 25]} />
              <meshBasicMaterial
                side={THREE.DoubleSide}
                attach="material"
                color={'blue'}
              />
            </mesh>
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
    );
  }
);

type LandAndWater = {
  land: { positions: Float32Array; indices: Uint16Array };
  water: { positions: Float32Array; indices: Uint16Array };
  landGeometry: THREE.BufferGeometry<NormalBufferAttributes>;
};

const TileMesh = React.memo(
  ({
    id,
    selected,
    defending,
    landColor,
    waterColor,
    raised,
  }: {
    id: string;
    selected: boolean;
    defending: boolean;
    landColor: string;
    waterColor: string;
    raised: boolean;
  }) => {
    const { land, water, centerPoint } = useMemo(
      () => hexasphere.tileLookup[id],
      []
    );

    const { camera } = useThree();

    const click = useCallback((e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      startTransition(() => {
        selectTile(id, camera.position);
      });
    }, []);

    return (
      <>
        <mesh onClick={click}>
          {raised ? (
            <TroopCount
              x={centerPoint.x}
              y={centerPoint.y}
              z={centerPoint.z}
              selected={selected}
              defending={defending}
            />
          ) : null}
          <mesh visible={raised}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={land.positions}
                count={land.positions.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="index"
                array={land.indices}
                count={land.indices.length}
                itemSize={1}
              />
            </bufferGeometry>
            <meshStandardMaterial color={landColor} />
            <Edges color={selected ? 'yellow' : 'black'} threshold={50} />
          </mesh>
          <mesh visible={!raised}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={water.positions}
                count={water.positions.length / 3}
                itemSize={3}
              />
              <bufferAttribute
                attach="index"
                array={water.indices}
                count={water.indices.length}
                itemSize={1}
              />
            </bufferGeometry>
            <meshStandardMaterial color={waterColor} />
          </mesh>
        </mesh>
      </>
    );
  }
);

var camPosIndex = 0;

export const Hexasphere = React.memo(
  ({
    selectedTile,
  }: {
    selectedTile?: string;
  }) => {
    const mesh: React.MutableRefObject<THREE.Mesh | null> = useRef(null);

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

      return new Float32Array(createStars(1000));
    }, []);

    const { camera } = useThree();

    const cameraPath = useRef<{
      points: THREE.Vector3[];
      tangents: THREE.Vector3[];
    }>();

    useFrame(() => {
      if (cameraPath.current) {
        camPosIndex++;
        if (camPosIndex > 20) {
          camPosIndex = 0;
          cameraPath.current = undefined;
        } else {
          // @ts-ignore
          var camPos = cameraPath.current.points[camPosIndex];
          // @ts-ignore
          var camRot = cameraPath.current.tangents[camPosIndex];

          if (camRot && camPos) {
            camera.position.x = camPos.x;
            camera.position.y = camPos.y;
            camera.position.z = camPos.z;

            camera.rotation.x = camRot.x;
            camera.rotation.y = camRot.y;
            camera.rotation.z = camRot.z;
          }

          camera.lookAt(center);
        }
      }
    });

    const hs = useSnapshot(hexasphereProxy);

    useEffect(() => {
      const unsubscribe = subscribeKey(derived, 'cameraPath', (s) => {
        cameraPath.current = s;
      });

      return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (selectedTile) {
        selectTile(selectedTile, camera.position);
      }
    }, [selectedTile]);

    const landColor = useMemo(() => faker.color.rgb({ format: 'hex' }), []);
    const waterColor = useMemo(() => faker.color.rgb({ format: 'hex' }), []);

    return (
      <>
        <ambientLight />
        <directionalLight position={[0, 100, 25]} />
        <mesh ref={mesh}>
          {hs.tiles.map((t, i) => (
            <TileMesh
              key={t.id}
              id={t.id}
              selected={t.selected}
              defending={t.defending}
              raised={t.raised}
              landColor={landColor}
              waterColor={waterColor}
            />
          ))}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={stars.length / 3}
                itemSize={3}
                array={stars}
              />
            </bufferGeometry>
            <pointsMaterial size={2} color={'white'} transparent />
          </points>
        </mesh>
      </>
    );
  }
);
