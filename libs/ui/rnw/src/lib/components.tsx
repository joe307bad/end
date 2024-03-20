import React, { ReactNode, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Button,
  H1,
  H2,
  Input,
  TamaguiProvider,
  XStack,
  YStack,
} from 'tamagui';
import { config, tokens } from './tamagui.config';
import { View } from 'react-native';
import { Badge } from './Display';
import t, { useDeviceContext } from 'twrnc';
import { EndApiProvider } from '@end/data';
import { AuthProvider } from '@end/auth';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { Hexasphere } from '@end/hexasphere';

export const tw = t as any;

export const tamaguiTokens = tokens;

export function Providers({
  children,
  baseUrl,
}: {
  children: ReactNode;
  baseUrl?: string;
}) {
  // @ts-ignore
  useDeviceContext(tw);
  return (
    <ToastProvider burntOptions={{ from: 'bottom' }}>
      <AuthProvider>
        <EndApiProvider baseUrl={baseUrl}>
          <TamaguiProvider defaultTheme="dark" config={config}>
            {children}
            <ToastViewport bottom={0} />
          </TamaguiProvider>
        </EndApiProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export function SystemDetails({
  children,
  name,
  id,
  discoverSystem,
  setName,
  h1,
}: {
  children: ReactNode;
  id?: string;
  name: string;
  tags: string[];
  discoverSystem?: () => void;
  setName?: (name: string) => void;
  h1?: string;
}) {
  return (
    <>
      <H1 id={h1}>{name}</H1>
      <H2>{Date().toLocaleString()} - cd-13</H2>
      <YStack
        width="100%"
        maxWidth={300}
        marginHorizontal={15}
        marginVertical={10}
      >
        <XStack height={20} alignItems="center" space="$3">
          <Badge title="Undiscovered" color="red" />
          {id ? <Badge title={`# - ${id}`} color="blue" /> : null}
        </XStack>
      </YStack>
      {children}
      <Input
        onChange={(e) => {
          setName?.(e?.nativeEvent?.text);
        }}
        placeholder={name}
      />
      <Button onPress={discoverSystem}>Discover</Button>
    </>
  );
}

export function SolarSystem({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Sun() {
  return (
    <mesh>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial color="#E1DC59" />
    </mesh>
  );
}

const random = (a: number, b: number) => a + Math.random() * b;
const randomInt = (a: number, b: number) => Math.floor(random(a, b));
const randomColor = () => `cyan`;

export function PlanetWithMoon() {
  const planetRef = React.useRef();
  const planet: any = {
    id: 1,
    color: randomColor(),
    xRadius: (1 + 1.5) * 4,
    zRadius: (1 + 1.5) * 2,
    size: random(0.5, 1),
  };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const x = planet.xRadius * Math.sin(t);
    const z = planet.zRadius * Math.cos(t);
    // @ts-ignore
    if (planetRef?.current?.position) {
      // @ts-ignore
      planetRef.current.position.x = x;
      // @ts-ignore
      planetRef.current.position.z = z;
    }
  });

  return (
    <>
      {/* @ts-ignore */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshStandardMaterial color={planet.color} />
      </mesh>
      {/*<Elliptic xRadius={planet.xRadius} zRadius={planet.zRadius} />*/}
    </>
  );
}

export function Planet({ seed }: { seed: number }) {
  return <Hexasphere key={seed} />;
}

export function Lights() {
  return (
    <>
      <ambientLight />
      <pointLight position={[0, 0, 0]} />
    </>
  );
}

export function Elliptic({
  xRadius = 1,
  zRadius = 1,
  from,
  to,
}: {
  xRadius: number;
  zRadius: number;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
}) {
  const points = [];
  for (let index = 0; index < 64; index++) {
    const angle = (index / 64) * 2 * Math.PI;
    const x = xRadius * Math.cos(angle);
    const z = zRadius * Math.sin(angle);
    points.push(new THREE.Vector3(x, 0, z));
  }
  points.push(points[0]);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <>
      {/* @ts-ignore */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={10} />
      </line>
      {/* @ts-ignore */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={10} />
      </line>
    </>
  );
}

function getPointInBetweenByPerc(
  pointA: THREE.Vector3,
  pointB: THREE.Vector3,
  percentage: number
): THREE.Vector3 {
  var dir = pointB.clone().sub(pointA);
  var len = dir.length();
  dir = dir.normalize().multiplyScalar(len * percentage);
  return pointA.clone().add(dir);
}

const center = new THREE.Vector3(0, 0, 0);

const consoleLogCondition = (distance: number, log: any) => {
  if (distance < 15) {
    console.log(log);
  }
};

export function PortalPath({
  // actual radius is 50, add 6 to raise portal curve above surface
  radius = 50 + 6,
  from,
  to,
}: {
  radius?: number;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
}) {
  const { fromTo, liftOff, landing, portalCurve, liftoffCurve, landingCurve } =
    useMemo(() => {
      const fromV = new THREE.Vector3(from.x, from.y, from.z);
      const toV = new THREE.Vector3(to.x, to.y, to.z);

      const distance = fromV.distanceTo(toV);

      const surfaceOfPortalCurve: THREE.Vector3[] = [];
      let liftoffCurveHandle: THREE.Vector3 | null = null;
      let liftoffCurveMeetsPortalCurve: THREE.Vector3 | null = null;
      let landingCurveHandle: THREE.Vector3 | null = null;
      let landingCurveMeetsPortalCurve: THREE.Vector3 | null = null;

      const pointsOnPortalCurve = 64;

      for (let index = 0; index < pointsOnPortalCurve; index++) {
        const percent = index * (1 / pointsOnPortalCurve);
        // every 1/64 %, plot a point between from and to
        const pointBetweenFromAndTo = getPointInBetweenByPerc(
          fromV,
          toV,
          percent
        );

        // distance from point between from and to and center of sphere
        const distanceToCenter = pointBetweenFromAndTo.distanceTo(center);

        // distance from point between from and to and portal curve
        const distanceToSurface = radius - distanceToCenter;

        // vector to move point between from and to the surface of the portal curve
        const movePointBetweenFromOrToToPortalCurve = center
          .clone()
          .sub(pointBetweenFromAndTo)
          .normalize()
          .multiplyScalar(-distanceToSurface);

        // move point between from and to the portal curve
        pointBetweenFromAndTo.add(movePointBetweenFromOrToToPortalCurve);

        consoleLogCondition(distance, {
          liftoffCurveHandleX: liftoffCurveHandle?.x,
        });
        // 10% of portal curve is traveled
        if (percent > 0.1 && liftoffCurveHandle === null) {
          consoleLogCondition(distance, {
            liftoffCurveHandle: pointBetweenFromAndTo.x,
          });
          liftoffCurveHandle = pointBetweenFromAndTo;
        }

        consoleLogCondition(distance, { percent });
        // point where liftoff meets the surface of the portal curve (25% of portal curve)
        if (percent > 0.25 && liftoffCurveMeetsPortalCurve === null) {
          consoleLogCondition(distance, {
            liftoffCurveMeetsPortalCurve: pointBetweenFromAndTo.x,
          });
          liftoffCurveMeetsPortalCurve = pointBetweenFromAndTo;
        }

        // point where landing starts to begin (75% of portal curve)
        if (percent > 0.75 && landingCurveMeetsPortalCurve === null) {
          landingCurveMeetsPortalCurve = pointBetweenFromAndTo;
        }

        // 90% of portal curve is travelled
        if (percent > 0.9 && landingCurveHandle === null) {
          landingCurveHandle = pointBetweenFromAndTo;
        }

        if (percent > 0.25 && percent < 0.75) {
          surfaceOfPortalCurve.push(pointBetweenFromAndTo);
        }
      }

      const portal =
        liftoffCurveMeetsPortalCurve && landingCurveMeetsPortalCurve
          ? new THREE.CatmullRomCurve3([
              liftoffCurveMeetsPortalCurve,
              ...surfaceOfPortalCurve,
              landingCurveMeetsPortalCurve,
            ])
          : null;

      const liftoffCurve =
        liftoffCurveHandle && liftoffCurveMeetsPortalCurve
          ? new THREE.QuadraticBezierCurve3(
              fromV,
              liftoffCurveHandle,
              liftoffCurveMeetsPortalCurve
            )
          : null;

      const landingCurve =
        landingCurveHandle && landingCurveMeetsPortalCurve
          ? new THREE.QuadraticBezierCurve3(
              toV,
              landingCurveHandle,
              landingCurveMeetsPortalCurve
            )
          : null;

      const liftoffCurvePoints = liftoffCurve?.getPoints(50);
      const landingCurvePoints = landingCurve?.getPoints(50);
      return {
        portalCurve: portal
          ? new THREE.BufferGeometry().setFromPoints(portal.getPoints(50))
          : null,
        fromTo: new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]),
        liftOff:
          liftoffCurveMeetsPortalCurve && liftoffCurveHandle
            ? new Float32Array([
                liftoffCurveMeetsPortalCurve.x,
                liftoffCurveMeetsPortalCurve.y,
                liftoffCurveMeetsPortalCurve.z,
                liftoffCurveHandle.x,
                liftoffCurveHandle.y,
                liftoffCurveHandle.z,
              ])
            : null,
        landing: landingCurveMeetsPortalCurve
          ? new Float32Array([
              landingCurveMeetsPortalCurve.x,
              landingCurveMeetsPortalCurve.y,
              landingCurveMeetsPortalCurve.z,
            ])
          : null,
        liftoffCurve: liftoffCurvePoints
          ? new THREE.BufferGeometry().setFromPoints(liftoffCurvePoints)
          : null,
        landingCurve: landingCurvePoints
          ? new THREE.BufferGeometry().setFromPoints(landingCurvePoints)
          : null,
      };
    }, []);

  return (
    <>
      {/* @ts-ignore */}
      <line geometry={portalCurve}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/* @ts-ignore */}
      <line geometry={liftoffCurve}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/* @ts-ignore */}
      <line geometry={landingCurve}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/*<points>*/}
      {/*  <bufferGeometry>*/}
      {/*    <bufferAttribute*/}
      {/*      attach="attributes-position"*/}
      {/*      count={fromTo.length / 3}*/}
      {/*      itemSize={3}*/}
      {/*      array={fromTo}*/}
      {/*    />*/}
      {/*  </bufferGeometry>*/}
      {/*  <pointsMaterial size={5} color="blue" transparent />*/}
      {/*</points>*/}
      {/*{liftOff ? (*/}
      {/*  <points>*/}
      {/*    <bufferGeometry>*/}
      {/*      <bufferAttribute*/}
      {/*        attach="attributes-position"*/}
      {/*        count={liftOff.length / 3}*/}
      {/*        itemSize={3}*/}
      {/*        array={liftOff}*/}
      {/*      />*/}
      {/*    </bufferGeometry>*/}
      {/*    <pointsMaterial size={5} color="green" transparent />*/}
      {/*  </points>*/}
      {/*) : null}*/}
      {/*<points>*/}
      {/*  <bufferGeometry>*/}
      {/*    <bufferAttribute*/}
      {/*      attach="attributes-position"*/}
      {/*      count={landing.length / 3}*/}
      {/*      itemSize={3}*/}
      {/*      array={landing}*/}
      {/*    />*/}
      {/*  </bufferGeometry>*/}
      {/*  <pointsMaterial size={5} color="red" transparent />*/}
      {/*</points>*/}
    </>
  );
}

export function Container({ children }: { children: ReactNode }) {
  return (
    <View style={{ display: 'flex', alignItems: 'center', padding: 50 }}>
      <View style={{ maxWidth: '100%' }}>{children}</View>
    </View>
  );
}
