import { Badge, H1, PrimaryButton } from '@end/components';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, User, War } from '@end/wm/core';
import { Database, Q, Relation } from '@nozbe/watermelondb';
import { H2, ListItem, Text, YStack, View, H3, XStack } from 'tamagui';
import { combineLatest, map, Observable, of } from 'rxjs';
import { ComponentType } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';

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

function UserInfoEnhanced({ users }: { users: User[] }) {
  return (
    <XStack paddingTop={'$0.75'} space="$0.5">
      {users.map((u) => (
        <Badge title={u.userName} />
      ))}
    </XStack>
  );
}

const UserInfo = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({ war }: { war: War }): { users: Observable<User[]> } => {
      return {
        users: war.users.observe(),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(UserInfoEnhanced);

function Conquest({
  wars,
}: {
  wars: War[];
  scoreboard: { userName: string; score: number }[];
}) {
  const { services } = useEndApi();
  const { syncService } = services;
  const scoreboard = useLoaderData() as { name: string; score: number }[];
  const navigate = useNavigate();
  return (
    <View width="100%" paddingTop="$1" alignItems="center">
      <YStack width="500px" maxWidth="100%">
        <PrimaryButton onPress={() => execute(syncService.sync())}>
          Sync
        </PrimaryButton>
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
              subTitle={
                <>
                  <PlanetInfo war={war} />
                  <UserInfo war={war} />
                </>
              }
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
    ['database', 'userId'],
    ({
      database,
      userId,
    }: {
      database: Database;
      userId: string;
    }): {
      wars: Observable<War[]>;
    } => {
      const warsWithUser$ = database
        .get<War>('wars')
        .query(Q.on('war_users', Q.where('user_id', userId)))
        .observe();

      const allWars$ = database.get<War>('wars').query().observe();

      return {
        wars: combineLatest([warsWithUser$, allWars$]).pipe(
          map(([warsWithUser, allWars]) => {
            const warWithUserIds = new Set(warsWithUser.map((war) => war.id));

            const warsWithoutUser = allWars.filter(
              (war) => !warWithUserIds.has(war.id)
            );

            return [...warsWithUser.reverse(), ...warsWithoutUser.reverse()];
          })
        ),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(Conquest);
