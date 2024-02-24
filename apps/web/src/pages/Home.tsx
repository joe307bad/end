import { H1, PrimaryButton } from '@end/components';
import { useCallback, ComponentType } from 'react';
import { database, sync } from '@end/wm/web';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database, Query } from '@nozbe/watermelondb';
import { useAuth } from '@end/auth';

function Home({ allPlanets }: { allPlanets: Planet[] }) {
  const { getToken } = useAuth();
  const addPlanet = useCallback(async () => {
    await database.write(async () => {
      await database.get('planets').create((planet: any) => {
        planet.name = Math.random().toString();
      });
    });
  }, []);

  return (
    <>
      <H1>Home</H1>
      <PrimaryButton onPress={addPlanet}>Add planet</PrimaryButton>
      <PrimaryButton onPress={() => getToken().then((t) => sync(t))}>
        Sync
      </PrimaryButton>
      <ul>
        {allPlanets.map((planet) => (
          <li>{planet.name}</li>
        ))}
      </ul>
    </>
  );
}

export default compose(
  withDatabase,
  withObservables(
    [],
    ({ database }: { database: Database }): { allPlanets: Query<Planet> } => ({
      allPlanets: database.get<Planet>('planets').query(),
    })
  ) as (arg0: unknown) => ComponentType
)(Home);
