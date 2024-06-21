import { H2 } from 'tamagui';
import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { io } from 'socket.io-client';
import { PrimaryButton } from '@end/components';

const tile1 = '0,50,0';
const tile2 = '0,-50,0';

export default function War() {
  let params = useParams();
  const { services } = useEndApi();
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
            console.log({ tile1: s.context.tiles[tile1].troopCount });
            console.log({ tile2: s.context.tiles[tile2].troopCount });
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

  return (
    <>
      <H2 paddingLeft="$1"> {`War: ${params.id}`}</H2>
      <PrimaryButton onPress={attack}>Attack</PrimaryButton>
    </>
  );
}
