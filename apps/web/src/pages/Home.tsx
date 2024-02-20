import { H1, PrimaryButton } from '@end/components';
import { useState, useCallback } from 'react';
import { database } from '@end/wm/web';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';

function Home({ allPlanets }: { allPlanets: Planet[] }) {
  console.log({ allPlanets });

  const addPlanet = useCallback(async () => {
    await database.write(async () => {
      await database.get('planets').create((planet: any) => {
        planet.name = Math.random().toString();
      });
    });
  }, []);

  // useEffect(() => {
  //   if (database) {
  //     database
  //       .get('planets')
  //       .query()
  //       .fetch()
  //       .then((p) => {
  //         setPlanets(p);
  //       });
  //   }
  // }, [database]);

  return (
    <>
      <H1>Home</H1>
      <PrimaryButton onPress={addPlanet}>Add planet</PrimaryButton>
    </>
  );
}

export default compose(
  withDatabase,
  // @ts-ignore
  withObservables([], ({ database }) => ({
    allPlanets: database.get('planets').query(),
  }))
)(Home);
