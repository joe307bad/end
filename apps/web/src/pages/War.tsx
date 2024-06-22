import { H2 } from 'tamagui';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { io } from 'socket.io-client';
import { PrimaryButton, TabsContainer } from '@end/components';
import { Canvas } from '@react-three/fiber';
import { Hexasphere } from '@end/hexasphere';
import { OrbitControls } from '@react-three/drei';
import { View } from 'react-native';
import * as THREE from 'three';

const tile1 = '0,50,0';
const tile2 = '0,-50,0';

export default function War() {
  let params = useParams();
  const { services } = useEndApi();
  const { getProxy, getDerived, getColors } = services.hexaService;

  const attack = useCallback(() => {
    if (!params.id) {
      return;
    }

    return execute(
      services.conquestService.attack({ tile1, tile2, warId: params.id })
    );
  }, []);
  //
  useEffect(() => {
    // if (params.id) {
    //   execute(services.conquestService.getWar(params.id))
    //     .then((r) => r.json())
    // }
    if (params.id) {
      services.conquestService.connectToWarLog(params.id).subscribe((r) => {
        try {
          if (r) {
            const s = JSON.parse(
              JSON.parse(r).updateDescription.updatedFields.state
            );
            console.log('///');
            console.log({ tiles: s.context.tiles });
            console.log({ tile1: s.context.tiles[tile1].troopCount });
            console.log({ tile2: s.context.tiles[tile2].troopCount });

            const tile = getProxy().tiles.find((tile) => tile.id === tile1);

            if(tile) {
              tile.troopCount = s.context.tiles[tile1].troopCount;
            }
          }
        } catch (e) {}
      });
    }

    // setInterval(() => {
    //   if (params.id) {
    //     services.conquestService.createWarLogEvent(params.id);
    //   }
    // }, 1000);
  }, []);
  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <H2 paddingLeft="$1">{params.id}</H2>
      <Canvas style={{ flex: 1 }} camera={cam}>
        <Hexasphere
          derived={getDerived()}
          proxy={getProxy()}
          selectedTile={tile1}
          waterColor={getColors().water}
          landColor={getColors().land}
        />
        <OrbitControls />
      </Canvas>
      <PrimaryButton onPress={attack}>Attack</PrimaryButton>
    </View>
  );
}
