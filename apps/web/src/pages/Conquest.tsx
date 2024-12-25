import { H1 } from '@end/components';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, War } from '@end/wm/core';
import { Database, Q, Relation } from '@nozbe/watermelondb';
import { H2, ListItem, Text, YStack, View, H3 } from 'tamagui';
import { from, map, Observable } from 'rxjs';
import { ComponentType, useEffect } from 'react';
import { execute } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { useLoaderData, useNavigate } from 'react-router-dom';

function PlanetInfoEnhanced({ planet }: { planet: Planet }) {
  return <H3>The War of {planet.name}</H3>;
}

const PlanetInfo = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({ war }: { war: War }): { planet: Relation<Planet> } => ({
      planet: war.planet,
    })
  ) as (arg0: unknown) => ComponentType
)(PlanetInfoEnhanced);

function Conquest({
  wars,
}: {
  wars: War[];
  scoreboard: { userName: string; score: number }[];
}) {
  const scoreboard = useLoaderData() as { name: string; score: number }[];
  const navigate = useNavigate();
  return (
    <View width="100%" paddingTop="$1" alignItems="center">
      <YStack width="500px" maxWidth="100%">
        <View>
          <H2 paddingLeft="$1" borderBottomWidth="1px">
            Leaderboard
          </H2>
          {scoreboard.map(({ name, score }, i) => (
            <ListItem
              backgroundColor={'transparent'}
              icon={<Text>{i + 1}</Text>}
              title={name}
              iconAfter={<Text>{score}</Text>}
            />
          ))}
        </View>
      </YStack>
      <YStack width="500px" maxWidth="100%">
        <View space="$1">
          <H2 paddingLeft="$1" borderBottomWidth="1px">
            Wars
          </H2>
          {wars.map((war, i) => (
            <ListItem
              cursor="pointer"
              onPress={() => navigate(`/war/${war.id}`)}
              icon={<Text>{i + 1}</Text>}
              title={war.id}
              subTitle={<PlanetInfo war={war} />}
            />
          ))}
        </View>
      </YStack>
    </View>
  );
}

export default compose(
  withDatabase,
  withObservables(
    [],
    ({ database }: { database: Database }): { wars: Observable<War[]> } => ({
      wars: database.get<War>('wars').query().observe().pipe(map(r => r.reverse())),
    })
  ) as (arg0: unknown) => ComponentType
)(Conquest);
