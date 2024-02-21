import { H1, PrimaryButton } from '@end/components';
import { useCallback, ComponentType } from 'react';
import { Text } from 'tamagui';
import { database } from '@end/wm/rn';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database, Query } from '@nozbe/watermelondb';

function Home({ allPlanets }: { allPlanets: Planet[] }) {
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
      {allPlanets.map((planet) => (
        <Text>{planet.name}</Text>
      ))}
      <PrimaryButton onPress={addPlanet}>Add planet</PrimaryButton>
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
)(Home) as ComponentType;
