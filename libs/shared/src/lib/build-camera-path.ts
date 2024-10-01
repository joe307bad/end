import * as THREE from 'three';
import { MathUtils } from 'three';

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

export function buildCameraPath(point1: THREE.Vector3, point2: THREE.Vector3) {
  const pointsOnPath = 1000;
  const evenPoints = 1000;
  const radius = center.distanceTo(point1);

  function _getPoints(_point1: THREE.Vector3, _point2: THREE.Vector3) {
    const path = [];
    for (let index = 0; index < pointsOnPath; index++) {
      const percent = index * (1 / pointsOnPath);
      const onPath = getPointInBetweenByPerc(_point1, _point2, percent);

      const distanceToPath = radius - onPath.distanceTo(center);
      const dir = center
        .clone()
        .sub(onPath)
        .normalize()
        .multiplyScalar(distanceToPath);
      onPath.sub(dir);

      path.push(onPath);
    }
    return path;
  }

  let points = new THREE.CatmullRomCurve3(
    _getPoints(point1, point2)
  ).getSpacedPoints(evenPoints);

  if (point1.distanceTo(point2) > radius) {
    points = [
      ...new THREE.CatmullRomCurve3(
        _getPoints(point1, new THREE.Vector3(radius, 0, 0))
      ).getSpacedPoints(evenPoints),
      ...new THREE.CatmullRomCurve3(
        _getPoints(new THREE.Vector3(radius, 0, 0), point2)
      ).getSpacedPoints(evenPoints),
    ];
  }

  const crossingOverPole = (): undefined | THREE.Vector3 => {
    let closeArray = undefined;
    points.forEach((point: THREE.Vector3) => {
      const poles = [
        new THREE.Vector3(0, -radius, 0),
        new THREE.Vector3(0, radius, 0),
      ];
      const close = poles.find((p) => point.distanceTo(p) < 10);
      if (close) {
        closeArray = close;
      }
    });
    return closeArray;
  };

  const pole = crossingOverPole();

  if (pole) {
    const middle = pole.clone();
    const dir = pole.clone().sub(center).normalize().multiplyScalar(10);
    middle
      .add(dir)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), MathUtils.degToRad(10));

    points = [
      ...new THREE.CatmullRomCurve3(_getPoints(point1, middle)).getSpacedPoints(
        evenPoints
      ),
      ...new THREE.CatmullRomCurve3(_getPoints(middle, point2)).getSpacedPoints(
        evenPoints
      ),
    ];
  }

  const tangents = [...Array(evenPoints).keys()].map((_, i) =>
    new THREE.CatmullRomCurve3(points).getTangent(i / evenPoints)
  );

  return {
    points: new THREE.CatmullRomCurve3(points).getSpacedPoints(evenPoints),
    tangents,
  };
}
