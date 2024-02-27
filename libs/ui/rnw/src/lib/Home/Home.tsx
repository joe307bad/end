import { H1, PrimaryButton } from '@end/components';
import React, { useCallback, ComponentType } from 'react';
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
import { Text } from 'tamagui';
import { FlatList } from 'react-native';

function H({
  allPlanets,
  database,
  sync,
  apiUrl,
}: {
  allPlanets: Planet[];
  database: Database;
  sync: (token: string | null, apiUrl?: string) => void;
  apiUrl?: string;
}) {
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
      <PrimaryButton onPress={() => getToken().then((t) => sync(t, apiUrl))}>
        Sync
      </PrimaryButton>
      <FlatList
        data={allPlanets}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </>
  );
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
