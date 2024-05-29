import { H1 } from '@end/components';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, War } from '@end/wm/core';
import { Database } from '@nozbe/watermelondb';
import { ListItem } from 'tamagui';
import { Observable } from 'rxjs';
import { ComponentType } from 'react';

function Conquest({ wars }: { wars: War[] }) {
  return (
    <>
      <H1>Conquest</H1>
      {wars.map((war) => (
        <ListItem title={war.id} subTitle={war.planet.id} />
      ))}
    </>
  );
}

export default compose(
  withDatabase,
  withObservables(
    [],
    ({ database }: { database: Database }): { wars: Observable<War[]> } => ({
      wars: database.get<War>('wars').query().observe(),
    })
  ) as (arg0: unknown) => ComponentType
)(Conquest);
