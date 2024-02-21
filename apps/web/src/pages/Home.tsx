import { H1, PrimaryButton } from '@end/components';
import { useState, useCallback, ComponentType, ReactNode } from 'react';
import { database } from '@end/wm/web';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database, Model, Query } from '@nozbe/watermelondb';

function Home({ allPlanets }: { allPlanets: Planet[] }) {
  console.log({ allPlanets });

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
