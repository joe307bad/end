import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@react-three/fiber';
import { faker } from '@faker-js/faker';
import { extend, Object3DNode, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
// @ts-ignore
import tf from 'three/examples/fonts/helvetiker_regular.typeface.json';

import { proxy, subscribe, useSnapshot } from 'valtio';
import { derive, subscribeKey } from 'valtio/utils';
// @ts-ignore
import HS from './hexasphere.lib';
import { cameraPosition } from 'three/examples/jsm/nodes/accessors/CameraNode';
import { buildPath } from './build-path';

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
};

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

function getBoundaries(t: Tile) {
  const v: number[] = [];

  function raise() {
    return false;
  }

  t.boundary.forEach((bp) => {
    if (raise()) {
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

const hexasphereProxy = proxy<{
  selection: {
    selectedId: string | null;
    cameraPosition: THREE.Vector3 | null;
  };
  tiles: { id: string; selected: boolean }[];
}>({
  selection: {
    selectedId: null,
    cameraPosition: null,
  },
  tiles: Object.keys(hexasphere.tileLookup).map((tileId: string) => ({
    id: tileId,
    selected: false,
  })),
});

function selectTile(id: string, cameraPosition: THREE.Vector3) {
  const currentlySelected = hexasphereProxy.tiles.find((tile) => tile.selected);

  if (currentlySelected) {
    currentlySelected.selected = false;
  }

  const newSelected = hexasphereProxy.tiles.find((tile) => tile.id === id);

  if (newSelected) {
    newSelected.selected = true;
    hexasphereProxy.selection.selectedId = newSelected.id;
    hexasphereProxy.selection.cameraPosition = cameraPosition;
  }

  return currentlySelected;
}

const derived = derive({
  cameraPath: (get) => {
    const selectedId = get(hexasphereProxy.selection).selectedId;
    const cameraPosition = get(hexasphereProxy.selection).cameraPosition;
    if (selectedId && cameraPosition) {
      const { x, y, z } = hexasphere.tileLookup[selectedId].centerPoint;
      return buildPath(cameraPosition, new THREE.Vector3(x, y, z));
    }

    return undefined;
  },
});

const TileMesh = React.memo(
  ({ id, selected }: { id: string; selected: boolean }) => {
    const { centerPoint, raised, positions, indices } = useMemo(() => {
      const tile = hexasphere.tileLookup[id];
      return {
        ...hexasphere.tileLookup[id],
        ...getBoundaries(tile),
        raised: false,
      };
    }, []);

    const mesh: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    const text: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    const textMesh: React.MutableRefObject<THREE.Mesh | null> = useRef(null);
    const cyl: React.MutableRefObject<THREE.Mesh | null> = useRef(null);

    const geo: React.MutableRefObject<THREE.BufferGeometry | null> =
      useRef(null);
    const countGeo: React.MutableRefObject<THREE.CylinderGeometry | null> =
      useRef(null);
    const textGeo: React.MutableRefObject<TextGeometry | null> = useRef(null);
    const [countEdges, setCountEdges] = useState<
      [THREE.EdgesGeometry, THREE.LineBasicMaterial] | undefined
    >();
    const [edges, setEdges] = useState<
      [THREE.EdgesGeometry, THREE.LineBasicMaterial] | undefined
    >();

    // const selected = useMemo(() => {
    //   const id = `[${centerPoint.x},${centerPoint.y},${centerPoint.z}]`;
    //   return id === s;
    // }, [s]);

    // useLayoutEffect(() => {
    //   if (geo.current) {
    //     geo.current.attributes['position'].needsUpdate = true;
    //   }
    // }, [positions]);

    const cube = useRef();

    // useEffect(() => {
    //   if (geo.current && raised) {
    //     setEdges([
    //       new THREE.EdgesGeometry(geo.current, 50),
    //       new THREE.LineBasicMaterial({ color: 'black' }),
    //     ]);
    //     // const pth = new PointTextHelper();
    //     // mesh.current.add(pth);
    //     // pth.displayVertices(positions, {
    //     //   color: 'white',
    //     //   size: 10,
    //     //   format: (index) => `${index}`,
    //     // });
    //   }
    //
    //   if (
    //     countGeo.current &&
    //     text.current &&
    //     cyl.current &&
    //     textGeo.current &&
    //     textMesh.current
    //   ) {
    //     const cp = new THREE.Vector3(
    //       centerPoint.x,
    //       centerPoint.y,
    //       centerPoint.z
    //     );
    //
    //     cyl.current.rotation.x = MathUtils.degToRad(90);
    //     text.current?.position.copy(center.clone());
    //     text.current?.lookAt(cp.clone());
    //     text.current?.position.copy(cp.clone());
    //     // console.log('run');
    //
    //     textGeo.current.computeBoundingBox();
    //     const b = textGeo.current.boundingBox?.getCenter(new Vector3());
    //
    //     if (b) {
    //       textMesh.current.position.x -= b.x;
    //       textMesh.current.position.y -= b.y;
    //       textMesh.current.position.z += 1;
    //     }
    //
    //     setCountEdges([
    //       new THREE.EdgesGeometry(countGeo.current, 50),
    //       new THREE.LineBasicMaterial({ color: 'black' }),
    //     ]);
    //   }
    // }, []);

    const { camera } = useThree();

    const randomNumber = useMemo(
      () => faker.number.int({ min: 1, max: 9 }).toString(),
      []
    );
    //
    // useFrame(() => {
    //   if (text.current) {
    //     const b = text.current.position.clone();
    //     const a = new THREE.Object3D();
    //     a.position.set(b.x, b.y, b.z);
    //     a.lookAt(camera.position);
    //
    //     const z = a.rotation.z;
    //     // //
    //     const cp = new THREE.Vector3(
    //       centerPoint.x,
    //       centerPoint.y,
    //       centerPoint.z
    //     );
    //
    //     const dir1 = cp.clone().sub(center).normalize().multiplyScalar(10);
    //     cp.add(dir1);
    //
    //     text.current.rotation.z = z;
    //   }
    // });

    return (
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
                <lineSegments
                  geometry={countEdges[0]}
                  material={countEdges[1]}
                />
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
            selectTile(id, camera.position);
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
          <meshStandardMaterial color={selected ? 'red' : 'blue'} />
        </mesh>
        {edges?.[0] ? (
          <lineSegments geometry={edges[0]} material={edges[1]} />
        ) : null}
        {/*<points>*/}
        {/*  <bufferGeometry>*/}
        {/*    <bufferAttribute*/}
        {/*      attach="attributes-position"*/}
        {/*      count={z.length / 3}*/}
        {/*      itemSize={3}*/}
        {/*      array={z}*/}
        {/*    />*/}
        {/*  </bufferGeometry>*/}
        {/*  <pointsMaterial size={10} color="red" transparent />*/}
        {/*</points>*/}
        {/*<mesh ref={cube}>*/}
        {/*  <boxGeometry args={[1, 1, 1]} />*/}
        {/*  <meshBasicMaterial color="red" />*/}
        {/*</mesh>*/}
      </>
    );
  }
);

const poleIds = ['0,-50,0', '0,50,0'];

var camPosIndex = 0;

export const Hexasphere = () => {
  // const { camera } = useThree();
  //
  // const onClick = useCallback((id: { x: number; y: number; z: number }) => {
  //   setSelected?.(`[${id.x},${id.y},${id.z}]`);
  // }, []);

  const mesh: React.MutableRefObject<THREE.Mesh | null> = useRef(null);

  // const stars = useMemo(() => {
  //   const createStar = () => {
  //     const randomY = faker.number.int({ min: -1000, max: -50 });
  //     const randomY1 = faker.number.int({ min: 50, max: 1000 });
  //
  //     const randomX = faker.number.int({ min: -1000, max: -50 });
  //     const randomX1 = faker.number.int({ min: 50, max: 1000 });
  //
  //     const randomZ = faker.number.int({ min: -1000, max: -50 });
  //     const randomZ1 = faker.number.int({ min: 50, max: 1000 });
  //
  //     return [
  //       faker.helpers.arrayElement([randomX, randomX1]),
  //       faker.helpers.arrayElement([randomY, randomY1]),
  //       faker.helpers.arrayElement([randomZ, randomZ1]),
  //     ];
  //   };
  //
  //   const createStars = (stars = 5) => {
  //     return new Array(stars).fill(undefined).flatMap(createStar);
  //   };
  //
  //   return new Float32Array(createStars(4000));
  // }, []);
  //
  // const [cameraPath, setCameraPath] = useState<THREE.CatmullRomCurve3>();
  // const [cameraPathPoints, setCameraPathPoints] = useState<Float32Array>();
  //
  // const points = useRef();

  // useEffect(() => {
  //   //0,-26.286555473703764,42.5325404993388
  //   //0,26.286555473703764,-42.5325404993388
  //
  //   function buildPath(point1: THREE.Vector3, point2: THREE.Vector3) {
  //     const pointsOnPath = 64;
  //     const radius = 160;
  //
  //     function _getPoints(_point1: THREE.Vector3, _point2: THREE.Vector3) {
  //       const path = [];
  //       for (let index = 0; index < pointsOnPath; index++) {
  //         const percent = index * (1 / pointsOnPath);
  //         const onPath = getPointInBetweenByPerc(_point1, _point2, percent);
  //
  //         const distanceToPath = radius - onPath.distanceTo(center);
  //         const dir = center
  //           .clone()
  //           .sub(onPath)
  //           .normalize()
  //           .multiplyScalar(distanceToPath);
  //         onPath.sub(dir);
  //
  //         path.push(onPath);
  //       }
  //       return path;
  //     }
  //
  //     function _getHalfwayPoint(
  //       _point1: THREE.Vector3,
  //       _point2: THREE.Vector3
  //     ) {
  //       const onPath = getPointInBetweenByPerc(_point1, _point2, 0.5);
  //       const distanceToPath = radius - onPath.distanceTo(center);
  //
  //       // move point away from overlapping poles
  //       const dir = center
  //         .clone()
  //         .sub(camera.position)
  //         .normalize()
  //         .multiplyScalar(10);
  //       onPath.sub(dir).applyEuler(new THREE.Euler(0, 0, Math.PI / 2));
  //
  //       // move point to the path of the camera
  //       const dir1 = center
  //         .clone()
  //         .sub(onPath)
  //         .normalize()
  //         .multiplyScalar(distanceToPath);
  //       onPath.sub(dir1);
  //
  //       return onPath;
  //     }
  //
  //     let points = new THREE.CatmullRomCurve3(
  //       _getPoints(point1, point2)
  //     ).getSpacedPoints(1000);
  //
  //     if (point1.distanceTo(point2) > 200) {
  //       points = [
  //         ...new THREE.CatmullRomCurve3(
  //           _getPoints(point1, new THREE.Vector3(radius, 0, 0))
  //         ).getSpacedPoints(1000),
  //         ...new THREE.CatmullRomCurve3(
  //           _getPoints(new THREE.Vector3(radius, 0, 0), point2)
  //         ).getSpacedPoints(1000),
  //       ];
  //     }
  //
  //     const crossingOverPole = (): undefined | THREE.Vector3 => {
  //       let crossingOverPole = false;
  //       let closeArray = null;
  //       points.forEach((point: THREE.Vector3) => {
  //         const poles = [
  //           new THREE.Vector3(0, -radius, 0),
  //           new THREE.Vector3(0, radius, 0),
  //         ];
  //         const close = poles.filter((p) => point.distanceTo(p) < 10);
  //         if (close.length > 0) {
  //           closeArray = close;
  //           crossingOverPole = true;
  //         }
  //       });
  //       return closeArray?.[0];
  //     };
  //
  //     const pole = crossingOverPole();
  //
  //     if (pole) {
  //       const middle = pole.clone();
  //       const dir = pole.clone().sub(center).normalize().multiplyScalar(10);
  //       middle
  //         .add(dir)
  //         .applyAxisAngle(new THREE.Vector3(1, 0, 0), MathUtils.degToRad(10));
  //
  //       points = [
  //         ...new THREE.CatmullRomCurve3(
  //           _getPoints(point1, middle)
  //         ).getSpacedPoints(1000),
  //         ...new THREE.CatmullRomCurve3(
  //           _getPoints(middle, point2)
  //         ).getSpacedPoints(1000),
  //       ];
  //     }
  //
  //     // setCameraPathPoints(
  //     //   new Float32Array(
  //     //     points
  //     //       .map((point: THREE.Vector3) => [point.x, point.y, point.z])
  //     //       .flatMap((x) => x)
  //     //   )
  //     // );
  //
  //     const curve = new THREE.CatmullRomCurve3(
  //       new THREE.CatmullRomCurve3(points).getSpacedPoints(1000)
  //     );
  //
  //     setCameraPath(curve);
  //   }
  //
  //   if (selected) {
  //     buildPath(
  //       camera.position,
  //       new THREE.Vector3(selected.x, selected.y, selected.z)
  //       // new THREE.Vector3(0, -26.286555473703764, 42.5325404993388),
  //       // new THREE.Vector3(0, 26.286555473703764, -42.5325404993388)
  //     );
  //   }
  // }, [selected]);

  const { camera } = useThree();
  const [cameraPath, setCameraPath] = useState<THREE.CatmullRomCurve3>();

  useFrame(() => {
    // if(false) {
    if (cameraPath) {
      camPosIndex++;
      if (camPosIndex > 25) {
        camPosIndex = 0;
        setCameraPath(undefined);
      } else {
        var camPos = cameraPath.getPoint(camPosIndex / 25);
        var camRot = cameraPath.getTangent(camPosIndex / 25);

        camera.position.x = camPos.x;
        camera.position.y = camPos.y;
        camera.position.z = camPos.z;

        camera.rotation.x = camRot.x;
        camera.rotation.y = camRot.y;
        camera.rotation.z = camRot.z;

        camera.lookAt(center);
      }
    }
  });

  const b = useMemo(() => new Float32Array([0, 0, 0]), []);
  const hs = useSnapshot(hexasphereProxy);

  useEffect(() => {
    subscribeKey(derived, 'cameraPath', (s) => {
      setCameraPath(s);
    });
  }, []);

  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 100, 25]} />
      <mesh ref={mesh}>
        {hs.tiles.map((t, i) => (
          <TileMesh key={t.id} id={t.id} selected={t.selected} />
        ))}
        {/*{cameraPathPoints && (*/}
        {/*  <points>*/}
        {/*    <bufferGeometry>*/}
        {/*      <bufferAttribute*/}
        {/*        attach="attributes-position"*/}
        {/*        count={cameraPathPoints.length / 3}*/}
        {/*        itemSize={3}*/}
        {/*        array={cameraPathPoints}*/}
        {/*      />*/}
        {/*    </bufferGeometry>*/}
        {/*    <pointsMaterial size={5} color={'white'} />*/}
        {/*  </points>*/}
        {/*)}*/}
        {/*<points>*/}
        {/*  <bufferGeometry>*/}
        {/*    <bufferAttribute*/}
        {/*      attach="attributes-position"*/}
        {/*      count={stars.length / 3}*/}
        {/*      itemSize={3}*/}
        {/*      array={stars}*/}
        {/*    />*/}
        {/*  </bufferGeometry>*/}
        {/*  <pointsMaterial size={2} color={'white'} transparent />*/}
        {/*</points>*/}
      </mesh>
    </>
  );
};
