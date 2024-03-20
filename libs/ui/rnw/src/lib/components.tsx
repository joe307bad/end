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

export function PortalPath({
  xRadius = 60,
  zRadius = 60,
  from,
  to,
}: {
  xRadius?: number;
  zRadius?: number;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
}) {
  const [portal, points, circles, portal1, portal2] = useMemo(() => {
    const fromV = new THREE.Vector3(from.x, from.y, from.z);
    const toV = new THREE.Vector3(to.x, to.y, to.z);

    const b = fromV.angleTo(toV);

    const points = [];
    for (let index = 0; index < 64; index++) {
      const angle = (index / 64) * b;
      const x = xRadius * Math.cos(angle);
      const z = zRadius * Math.sin(angle);
      points.push([x, 0, z]);
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

    const portalPoints = [];
    const portalVs = [];
    var perc = 0;
    var inc = 1 / 64;
    var liftoff: THREE.Vector3 | null = new THREE.Vector3();
    var liftoff1: THREE.Vector3 | null = new THREE.Vector3();
    var landing: THREE.Vector3 | null = new THREE.Vector3();
    var landing1: THREE.Vector3 | null = new THREE.Vector3();
    var liftoffV: any[] = [];
    var landingV: any[] = [];
    var mid: THREE.Vector3 | null = new THREE.Vector3();
    for (let index = 0; index < 64; index++) {
      perc += inc;
      const p = getPointInBetweenByPerc(fromV, toV, perc);

      const distanceToCenter = p.distanceTo(new THREE.Vector3(0, 0, 0));
      const distanceToSurface = 60 - distanceToCenter;
      var directionVector = new THREE.Vector3(0, 0, 0)
        .sub(p)
        .normalize()
        .multiplyScalar(-distanceToSurface);

      p.add(directionVector);

      if (perc > 0.25 && !liftoff.x) {
        liftoff = p;
        // liftoffV.push(p);
      }

      if (perc > 0.1 && !liftoff1.x) {
        liftoff1 = p;
        // liftoffV.push(p);
      }

      if (perc > 0.75 && !landing.x) {
        landing = p;
        // landingV.push(p.x, p.y, p.z);
      }

      if (perc > 0.9 && !landing1.x) {
        landing1 = p;
        // landingV.push(p.x, p.y, p.z);
      }

      portalPoints.push(p.x, p.y, p.z);
      if (perc > 0.25 && perc < 0.75) {
        portalVs.push(p);
      }
    }

    const middleLiftoff = getPointInBetweenByPerc(fromV, liftoff, 0.5);

    const curve = new THREE.CatmullRomCurve3([liftoff, ...portalVs, landing]);

    const liftoffCurve = new THREE.QuadraticBezierCurve3(
      fromV,
      liftoff1,
      liftoff
    );

    const landingCurve = new THREE.QuadraticBezierCurve3(
      toV,
      landing1,
      landing
    );

    const points1 = curve.getPoints(200);
    const liftoffCurvePoints = liftoffCurve.getPoints(200);
    const landingCurvePoints = landingCurve.getPoints(200);
    return [
      new THREE.BufferGeometry().setFromPoints(points1),
      new Float32Array(portalPoints),
      new Float32Array([
        from.x,
        from.y,
        from.z,
        to.x,
        to.y,
        to.z,
        liftoff.x,
        liftoff.y,
        liftoff.z,
        liftoff1.x,
        liftoff1.y,
        liftoff1.z,
        landing.x,
        landing.y,
        landing.z,
        middleLiftoff.x,
        middleLiftoff.y,
        middleLiftoff.z,
      ]),
      new THREE.BufferGeometry().setFromPoints(liftoffCurvePoints),
      new THREE.BufferGeometry().setFromPoints(landingCurvePoints),
    ];
  }, []);

  return (
    <>
      {/* @ts-ignore */}
      <line geometry={portal}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/* @ts-ignore */}
      <line geometry={portal1}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/* @ts-ignore */}
      <line geometry={portal2}>
        <lineBasicMaterial attach="material" color="#BFBBDA" linewidth={50} />
      </line>
      {/*<points>*/}
      {/*  <bufferGeometry>*/}
      {/*    <bufferAttribute*/}
      {/*      attach="attributes-position"*/}
      {/*      count={points.length / 3}*/}
      {/*      itemSize={3}*/}
      {/*      array={points}*/}
      {/*    />*/}
      {/*  </bufferGeometry>*/}
      {/*  <pointsMaterial size={2} color="red" transparent />*/}
      {/*</points>*/}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={circles.length / 3}
            itemSize={3}
            array={circles}
          />
        </bufferGeometry>
        <pointsMaterial size={5} color="blue" transparent />
      </points>
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
