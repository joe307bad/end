import React, { ReactNode, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Button,
  H1,
  H2,
  Input,
  TabsContentProps,
  TamaguiProvider,
  XStack,
  YStack,
  Text,
  Section,
} from 'tamagui';
import { config, tokens } from './tamagui.config';
import { View } from 'react-native';
import { Badge, PrimaryButton } from './Display';
import t, { useDeviceContext } from 'twrnc';
import { EndApiProvider } from '@end/data';
import { AuthProvider } from '@end/auth';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { Hexasphere, useHexasphere } from '@end/hexasphere';
import { H5, Separator, SizableText, Tabs } from 'tamagui';
import { Slider } from '@miblanchard/react-native-slider';

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

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$background"
      key="tab3"
      padding="$2"
      alignItems="center"
      justifyContent="center"
      flex={1}
      borderColor="$background"
      borderTopLeftRadius={0}
      borderTopRightRadius={0}
      borderRadius={5}
      borderWidth={1}
      borderLeftWidth={0}
      borderRightWidth={0}
      {...props}
    >
      {props.children}
    </Tabs.Content>
  );
};

export function Planet({
  children,
}: {
  children: (
    hexsphere: JSX.Element,
    controls: JSX.Element,
    footer: JSX.Element
  ) => ReactNode;
}) {
  const [reset, setReset] = useState(Math.random());
  const { tiles, hexasphere } = useHexasphere({ reset });
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);

  return (
    <Section style={tw`h-full w-full relative`}>
      {children(
        <Hexasphere
          key={reset}
          rotateX={rotateX}
          rotateY={rotateY}
          rotateZ={rotateZ}
          tiles={tiles}
          hexasphere={hexasphere}
        />,
        <Section style={tw`absolute right-[20px] top-[20px] z-10 w-[500px]`}>
          <Tabs
            defaultValue="tab3"
            orientation="horizontal"
            flexDirection="column"
            borderRadius={5}
            borderWidth={1}
            overflow="hidden"
            borderColor="$borderColor"
          >
            <Tabs.List
              separator={<Separator vertical />}
              disablePassBorderRadius="bottom"
              aria-label="Manage your account"
            >
              <Tabs.Tab borderWidth={0} flex={1} value="tab1">
                <SizableText fontFamily="$body">Details</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab2">
                <SizableText fontFamily="$body">View</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab3">
                <SizableText fontFamily="$body">Tiles</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab4">
                <SizableText fontFamily="$body">Debug</SizableText>
              </Tabs.Tab>
            </Tabs.List>
            <Separator />
            <TabsContent value="tab1">
              <Input padding="$0.5" width="100%" placeholder="Planet Name" />
            </TabsContent>

            <TabsContent value="tab2">
              <View
                style={{
                  flex: 1,
                  marginLeft: 10,
                  marginRight: 10,
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Text>Rotate X</Text>
                <Slider
                  value={rotateX}
                  onValueChange={(value: any) => setRotateX(value[0])}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  marginLeft: 10,
                  marginRight: 10,
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Text>Rotate Y</Text>
                <Slider
                  value={rotateY}
                  onValueChange={(value: any) => setRotateY(value[0])}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  marginLeft: 10,
                  marginRight: 10,
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Text>Rotate Z</Text>
                <Slider
                  value={rotateZ}
                  onValueChange={(value: any) => setRotateZ(value[0])}
                />
              </View>
            </TabsContent>

            <TabsContent value="tab3" style={tw`h-full`}>
              <Section style={tw`max-h-80 overflow-scroll`}>
                {tiles.map((t: any) => (
                  <Section style={tw`w-full`}>{t.id}</Section>
                ))}
              </Section>
            </TabsContent>

            <TabsContent value="tab4">
              <H5>Notifications</H5>
            </TabsContent>
          </Tabs>
        </Section>,
        <PrimaryButton onPress={() => setReset(Math.random())}>
          New Planet
        </PrimaryButton>
      )}
    </Section>
  );
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

export function PortalPath({
  // actual radius is 50, add 6 to raise portal curve above surface
  radius = 50 + 8,
  from,
  to,
}: {
  radius?: number;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
}) {
  const portal = useMemo(() => {
    const fromV = new THREE.Vector3(from.x, from.y, from.z);
    const toV = new THREE.Vector3(to.x, to.y, to.z);

    // move the from point so the portal tube goes through the surface of the sphere
    const movePointFrom = center
      .clone()
      .sub(fromV)
      .normalize()
      .multiplyScalar(5);

    // move the to point so the portal tube goes through the surface of the sphere
    const movePointTo = center.clone().sub(toV).normalize().multiplyScalar(5);

    fromV.add(movePointFrom);
    toV.add(movePointTo);

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

      // 10% of portal curve is traveled
      if (percent > 0.1 && liftoffCurveHandle === null) {
        liftoffCurveHandle = pointBetweenFromAndTo;
      }

      // point where liftoff meets the surface of the portal curve (25% of portal curve)
      if (percent > 0.25 && liftoffCurveMeetsPortalCurve === null) {
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

    // create the curve for the middle part of the portal curve
    const portal =
      liftoffCurveMeetsPortalCurve && landingCurveMeetsPortalCurve
        ? new THREE.CatmullRomCurve3([
            liftoffCurveMeetsPortalCurve,
            ...surfaceOfPortalCurve,
            landingCurveMeetsPortalCurve,
          ])
        : null;

    // create the liftoff curve
    const liftoffCurve =
      liftoffCurveHandle && liftoffCurveMeetsPortalCurve
        ? new THREE.QuadraticBezierCurve3(
            fromV,
            liftoffCurveHandle,
            liftoffCurveMeetsPortalCurve
          )
        : null;

    // create the landing curve
    const landingCurve =
      landingCurveHandle && landingCurveMeetsPortalCurve
        ? new THREE.QuadraticBezierCurve3(
            landingCurveMeetsPortalCurve,
            landingCurveHandle,
            toV
          )
        : null;

    const liftoffCurvePoints = liftoffCurve?.getPoints(100);
    const landingCurvePoints = landingCurve?.getPoints(100);

    // combine the points for the landing curve, the liftoff curve, and the middle curve that connect both
    const entirePortalCurve = [
      ...(liftoffCurvePoints ? liftoffCurvePoints : []),
      ...(portal ? portal.getPoints(100) : []),
      ...(landingCurvePoints ? landingCurvePoints : []),
    ];

    // create the tube from the points of three other curves
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(entirePortalCurve),
      70,
      0.8,
      50,
      false
    );
  }, []);

  return portal ? (
    <>
      <mesh geometry={portal}>
        <meshBasicMaterial color="red" toneMapped={false} />
      </mesh>
    </>
  ) : null;
}

export function Container({ children }: { children: ReactNode }) {
  return (
    <View style={{ display: 'flex', alignItems: 'center', padding: 50 }}>
      <View style={{ maxWidth: '100%' }}>{children}</View>
    </View>
  );
}
