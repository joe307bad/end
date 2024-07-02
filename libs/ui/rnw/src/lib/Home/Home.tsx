import React, { useCallback, ComponentType, ReactNode } from 'react';
import { Planet } from '@end/wm/core';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { useAuth } from '@end/auth';
import { faker } from '@faker-js/faker';
import { Observable } from 'rxjs';

function H({
  allPlanets,
  database,
  sync,
  apiUrl,
  children,
}: {
  allPlanets: Planet[];
  database: Database;
  sync: (token: string | null, apiUrl?: string) => void;
  apiUrl?: string;
  children?: ReactNode;
}) {
  const { getToken } = useAuth();
  const addPlanet = useCallback(async () => {
    await database.write(async () => {
      await database.get<Planet>('planets').create((planet: Planet) => {
        planet.name = Math.random().toString();
      });
    });
  }, []);

  const editPlanet = useCallback(async () => {
    await database.write(async () => {
      const randomPlanet = faker.helpers.arrayElement(allPlanets);
      const planet = await database.get<Planet>('planets').find(randomPlanet.id);
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

  return <>{children}</>;
}

export const Home = compose(
  withDatabase,
  withObservables(
    [],
    ({
      database,
    }: {
      database: Database;
    }): { allPlanets: Observable<Planet[]> } => ({
      allPlanets: database
        .get<Planet>('planets')
        .query()
        .observeWithColumns(['name']),
    })
  ) as (arg0: unknown) => ComponentType
)(H);
