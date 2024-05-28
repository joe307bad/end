import { Home as H, TabsContainer } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowDimensions } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { Hexasphere, hexasphereProxy } from '@end/hexasphere';
import { faker } from '@faker-js/faker';
import { H2 } from 'tamagui';
// @ts-ignore
import v from 'voca';

export default function Home() {
  const ref = useRef(null);

  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1297) {
      return [[0, 160, 25], {}];
    }

    return [
      [0, 160, 25],
      {
        minWidth: 2000,
        width: '150%',
        marginLeft: -600,
      },
    ];
  }, [width]);
  const cam = useMemo(() => {
    return new THREE.PerspectiveCamera(45);
  }, []);

  const [selectedTile, selectTile] = useState<string>();
  const [reset, setReset] = useState(Math.random());

  const newPlanet = useCallback(() => {
    hexasphereProxy.tiles.forEach((tile) => {
      // TODO is there a way to completed destroy and recreate the proxy + the hexasphere? This may resolve perf issues
      const raisedness = faker.number.float({ min: 0.1, max: 0.9 });
      const name = faker.lorem.word();
      tile.name = name;
      tile.raised = faker.datatype.boolean(raisedness);
      tile.selected = false;
      tile.defending = false;
    });
    hexasphereProxy.selection.selectedId = null;
    hexasphereProxy.selection.cameraPosition = null;
    setReset(Math.random());
  }, []);

  const name = useMemo(() => {
    function convertToRoman(num: number) {
      var roman = {
        M: 1000,
        CM: 900,
        D: 500,
        CD: 400,
        C: 100,
        XC: 90,
        L: 50,
        XL: 40,
        X: 10,
        IX: 9,
        V: 5,
        IV: 4,
        I: 1,
      };
      var str = '';

      for (var i of Object.keys(roman)) {
        // @ts-ignore
        var q = Math.floor(num / roman[i]);
        // @ts-ignore
        num -= q * roman[i];
        str += i.repeat(q);
      }

      return str;
    }

    const words = [
      faker.lorem.word(),
      faker.word.noun(),
      faker.person.lastName(),
      faker.science.chemicalElement().name,
      convertToRoman(faker.number.int({ min: 1, max: 1000 })),
    ];

    const word1 = words[faker.number.int({ min: 0, max: words.length - 1 })];

    function findWord2() {
      const word2 = words[faker.number.int({ min: 0, max: words.length - 1 })];
      if (word2 === word1) {
        return findWord2();
      }

      return word2;
    }

    return v.titleCase(`${word1} ${findWord2()}`);
  }, [reset]);

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <H2 paddingLeft="$1">{name}</H2>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <Hexasphere key={reset} selectedTile={selectedTile} />
        <OrbitControls />
      </Canvas>
      <TabsContainer
        menuOpen={true}
        selectTile={selectTile}
        newPlanet={newPlanet}
      />
    </H>
  );
}
