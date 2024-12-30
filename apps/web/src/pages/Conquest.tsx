import { Badge, H1, PrimaryButton } from '@end/components';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, User, War } from '@end/wm/core';
import { Database, Q, Relation } from '@nozbe/watermelondb';
import { ListItem, Text, YStack, View, H3, XStack } from 'tamagui';
import { combineLatest, map, Observable, of } from 'rxjs';
import { ComponentType, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { WarState } from '@end/war/core';
import { useSnapshot } from 'valtio/react';

function Status({ warId, status: s }: { warId: string; status: WarState }) {
  const { services } = useEndApi();
  const store = useSnapshot(services.endApi.store);

  const status = useMemo(() => {
    const cache = store.latestWarCache[warId]?.status;
    if (typeof cache !== 'undefined') {
      return cache;
    }

    return s;
  }, [store.latestWarCache[warId]?.status]);

  switch (status) {
    case 'searching-for-players':
      return <Badge title={'Searching for players'} />;
    case 'war-complete':
      return <Badge title={'Complete'} />;
    case 'war-in-progress':
      return <Badge title={'In progress'} />;
    default:
      return <></>;
  }
}

function PlanetInfoEnhanced({ planet, war }: { planet: Planet; war: War }) {
  return (
    <XStack alignItems="center">
      <H3
        overflow="hidden"
        textOverflow="ellipsis"
        flex={1}
        style={{ textWrap: 'nowrap' }}
      >
        The War of {planet.name}
      </H3>
      <Status warId={war.id} status={war.status} />
    </XStack>
  );
}

const PlanetInfo = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({ war }: { war: War }): { planet: Relation<Planet>; war: War } => ({
      planet: war.planet,
      war,
    })
  ) as (arg0: unknown) => ComponentType
)(PlanetInfoEnhanced);

function UserInfoEnhanced({
  warId,
  users: u,
}: {
  warId: string;
  users: User[];
}) {
  const { services } = useEndApi();
  const store = useSnapshot(services.endApi.store);
  const users = useMemo(() => {
    const cache = store.latestWarCache[warId]?.players;
    if (typeof cache !== 'undefined') {
      return cache;
    }

    return u;
  }, [store.latestWarCache[warId]?.players]);
  return (
    <XStack paddingTop={'$0.75'} space="$0.5">
      {!users ? <></> : users.map((u) => <Badge title={u.userName} />)}
    </XStack>
  );
}

const UserInfo = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({
      war,
    }: {
      war: War;
    }): { users: Observable<User[]>; warId: Observable<string> } => {
      return {
        users: war.users.observe(),
        warId: of(war.id),
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
          {wars.map((war, i) => (
            <ListItem
              backgroundColor="transparent"
              padding="0"
              margin="0"
              cursor="pointer"
              onPress={() => navigate(`/war/${war.id}`)}
              icon={<Text>{i + 1}</Text>}
              title={
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
