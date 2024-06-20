import { H2 } from 'tamagui';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { io } from 'socket.io-client';

export default function War() {
  let params = useParams();
  const { services } = useEndApi();
  //
  useEffect(() => {
    // if (params.id) {
    //   execute(services.conquestService.getWar(params.id))
    //     .then((r) => r.json())
    // }
    if (params.id) {
      services.conquestService
        .connectToWarLog(params.id)
        .subscribe(console.log);
    }

    setInterval(() => {
      if (params.id) {
        services.conquestService.createWarLogEvent(params.id);
      }
    }, 1000);
  }, []);

  return <H2 paddingLeft="$1"> {`War: ${params.id}`}</H2>;
}
