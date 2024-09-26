import { H1 } from 'tamagui';
import { useEndApi } from '@end/data/web';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio/react';
import { subscribeKey } from 'valtio/utils';
import { hexasphere } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import * as THREE from 'three';

export function War2() {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);

  useEffect(() => {
    const unsubscribe = subscribeKey(warService.derived, 'cameraPath', (s) => {
      console.log({ s });
    });

    warService.setCameraPosition(new THREE.Vector3(9, 9, 9));
    setInterval(() => {
      const allIds = Object.keys(hexasphere.tileLookup);
      const randomNumber = faker.number.int({ min: 0, max: allIds.length - 1 });
      warService.selectTile(allIds[randomNumber]);
    }, 1000);

    return () => unsubscribe();
  }, []);

  return <H1>War2</H1>;
}
