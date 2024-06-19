import { H2 } from 'tamagui';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';

export default function War() {
  let params = useParams();
  const { services } = useEndApi();
  //
  useEffect(() => {
    if (params.id) {
      execute(services.conquestService.getWar(params.id))
        .then((r) => r.json())
        .then(console.log);
    }
  }, []);

  return <H2 paddingLeft="$1"> {`War: ${params.id}`}</H2>;
}
