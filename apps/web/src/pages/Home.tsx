import { H1, PrimaryButton } from '@end/components';
import { useCallback, ComponentType } from 'react';
import { database, sync } from '@end/wm/web';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database, Model, Query } from '@nozbe/watermelondb';
import { useAuth } from '@end/auth';
import { faker } from '@faker-js/faker';
import {Observable} from "rxjs";

function Home({ allPlanets }: { allPlanets: Planet[] }) {
  const { getToken } = useAuth();
  const addPlanet = useCallback(async () => {
    await database.write(async () => {
      await database.get('planets').create((planet: any) => {
        planet.name = Math.random().toString();
      });
    });
  }, []);

  const editPlanet = useCallback(async () => {
    await database.write(async () => {
      const randomPlanet = faker.helpers.arrayElement(allPlanets);
      const planet: any = await database.get('planets').find(randomPlanet.id);
      await planet.update(() => {
        planet.name = `changed-${Math.random().toString()}`;
      });
    });
  }, [allPlanets]);

  const deletePlanet = useCallback(async () => {
    await database.write(async () => {
      const randomPlanet = faker.helpers.arrayElement(allPlanets);
      await randomPlanet.markAsDeleted();
    });
  }, [allPlanets]);

  return (
    <>
      <H1>Home</H1>
      <PrimaryButton onPress={deletePlanet}>Delete Planet</PrimaryButton>
      <PrimaryButton onPress={editPlanet}>Edit Planet</PrimaryButton>
      <PrimaryButton onPress={addPlanet}>Add planet</PrimaryButton>
      <PrimaryButton
        onPress={() =>
          getToken().then((t) => sync(t, process.env.API_BASE_URL))
        }
      >
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
    ({ database }: { database: Database }): { allPlanets: Observable<Planet[]> } => ({
      allPlanets: database
        .get<Planet>('planets')
        .query()
        .observeWithColumns(['name']),
    })
  ) as (arg0: unknown) => ComponentType
)(Home);
