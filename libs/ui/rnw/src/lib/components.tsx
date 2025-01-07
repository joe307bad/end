import React, { ReactNode, useMemo } from 'react';
import * as THREE from 'three';
import { TamaguiProvider, YStack } from 'tamagui';
import { config, tokens } from './tamagui.config';
import { View } from 'react-native';
import t, { useDeviceContext } from 'twrnc';
import { AuthProvider } from '@end/auth';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  useToastState,
} from '@tamagui/toast';
import '@react-three/fiber';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from 'date-fns';

export const tw = t as any;

export const tamaguiTokens = tokens;

export function Providers({ children }: { children: ReactNode }) {
  // @ts-ignore
  useDeviceContext(tw);
  return (
    <ToastProvider burntOptions={{ from: 'bottom' }}>
      <AuthProvider>
        <TamaguiProvider defaultTheme="dark" config={config}>
          {children}
          <ToastViewport bottom={0} />
        </TamaguiProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export function getReadableDate(date: Date): string {
  const now = new Date();

  // Calculate differences
  const minutesDiff = differenceInMinutes(now, date);
  const hoursDiff = differenceInHours(now, date);
  const daysDiff = differenceInDays(now, date);

  // Less than 1 minute ago
  if (minutesDiff < 1) {
    return '< 1 minute ago';
  }

  // Less than 1 hour ago
  if (hoursDiff < 1) {
    return `${minutesDiff} min${minutesDiff > 1 ? 's' : ''} ago`;
  }

  // Less than 1 day ago
  if (daysDiff < 1) {
    if (hoursDiff > 5) {
      return `about ${hoursDiff} hrs ago`;
    } else {
      if (hoursDiff === 1 && minutesDiff < 75) {
        return `about an hr ago`;
      }

      if (minutesDiff >= 75 && minutesDiff < 105) {
        return `about ${hoursDiff} hr${
          hoursDiff > 1 ? 's' : ''
        } and 30 min ago`;
      }

      return `about ${hoursDiff + 1} hrs ago`;
    }
  }

  // 1 day ago
  if (daysDiff === 1) {
    return 'Yesterday';
  }

  // Less than 7 days ago
  if (daysDiff <= 7) {
    return `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
  }

  // More than 7 days ago
  return format(date, 'MMM. d, yyyy @ h:mm');
}

export function getPointInBetweenByPerc(
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
  from?: { x: number; y: number; z: number };
  to?: { x: number; y: number; z: number };
}) {
  if (!from || !to) {
    return null;
  }

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
  }, [from, to]);

  return portal ? (
    <>
      <mesh geometry={portal}>
        <meshBasicMaterial color="red" toneMapped={false} />
      </mesh>
    </>
  ) : null;
}

export const CurrentToast = () => {
  const currentToast = useToastState();

  return (
    <Toast
      key={currentToast?.id}
      duration={currentToast?.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="medium"
      viewportName={currentToast?.viewportName}
    >
      <YStack padding="$0.5">
        <Toast.Title>{currentToast?.title}</Toast.Title>
        {!!currentToast?.message && (
          <Toast.Description>{currentToast?.message}</Toast.Description>
        )}
      </YStack>
    </Toast>
  );
};

export function Container({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <View style={{ maxWidth: '100%', height: '100%' }}>{children}</View>
    </View>
  );
}
