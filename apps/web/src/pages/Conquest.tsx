import { ResponsiveStack } from '@end/components';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, User, War } from '@end/wm/core';
import { Database, Q, Relation } from '@nozbe/watermelondb';
import {
  ListItem,
  Text,
  YStack,
  View,
  H3,
  XStack,
  Popover,
  H4,
  StackProps,
} from 'tamagui';
import { Badge } from '@end/ui/shared';
import { combineLatest, from, map, Observable, of } from 'rxjs';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEndApi } from '@end/data/web';
import { getReadableDate, WarState } from '@end/war/core';
import { useSnapshot } from 'valtio/react';
import { format } from 'date-fns';

function Status({
  warId,
  status: s,
  turn: t,
}: {
  warId: string;
  status: WarState;
  turn?: string | null;
}) {
  const { services } = useEndApi();
  const store = useSnapshot(services.endApi.store);

  const [status, turn] = useMemo(() => {
    const statusCache = store.latestWarCache[warId]?.status;
    const turnCache = store.latestWarCache[warId]?.turn;
    const status = !statusCache ? s : statusCache;
    const turn = !turnCache ? t : turnCache;
    return [status, turn];
  }, [store.latestWarCache[warId]?.status, store.latestWarCache[warId]?.turn]);

  if (turn === services.warService.store.userId) {
    return <Badge color="yellow" title={'Your turn'} />;
  }

  switch (status) {
    case 'searching-for-players':
      return <Badge color="orange" title={'Searching for players'} />;
    case 'war-complete':
      return <Badge color="purple" title={'Conquered'} />;
    case 'war-in-progress':
      return <Badge color="blue" title={'In progress'} />;
    default:
      return <></>;
  }
}

function PlanetInfoEnhanced({ planet, war }: { planet: Planet; war: War }) {
  return (
    <XStack cursor="pointer" alignItems="center">
      <H3
        overflow="hidden"
        textOverflow="ellipsis"
        style={{ textWrap: 'nowrap' }}
        flex={1}
        paddingRight="$1"
      >
        {planet.name}
      </H3>
      <Status warId={war.id} status={war.status} turn={war.turn.id} />
    </XStack>
  );
}

function UpdatedDate({ updatedAt }: { updatedAt: Date }) {
  const [open, setOpen] = useState(false);
  const [_, setRerender] = useState(Math.random());

  useEffect(() => {
    const interval = setInterval(() => {
      setRerender(Math.random());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <XStack alignItems="center">
        <Popover size="$5" allowFlip open={open}>
          <Popover.Trigger asChild>
            <Text
              onHoverIn={() => {
                setOpen(true);
              }}
              onHoverOut={() => setOpen(false)}
            >
              {getReadableDate(updatedAt)}
            </Text>
          </Popover.Trigger>

          <Popover.Content
            enterStyle={{ y: -10, opacity: 0 }}
            exitStyle={{ y: -10, opacity: 0 }}
            elevate
            padding="$0.75"
            animation={[
              'fast',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
          >
            <YStack gap="$3">
              <XStack gap="$3">
                <Text fontSize={13} maxWidth={500}>
                  {format(updatedAt, 'MMM. d, yyyy @ h:mm')}
                </Text>
              </XStack>
            </YStack>
          </Popover.Content>
        </Popover>
      </XStack>
    </View>
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
  updatedAt: ua,
}: {
  updatedAt: Date;
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
  const updatedAt = useMemo(() => {
    const cache = store.latestWarCache[warId]?.updatedAt;
    if (typeof cache !== 'undefined' && cache !== null) {
      return new Date(cache);
    }

    return ua;
  }, [store.latestWarCache[warId]?.updatedAt]);

  return (
    <XStack cursor="pointer" alignItems="center" paddingTop={'$0.75'}>
      <XStack flex={1} gap="$0.5">
        {!users ? (
          <></>
        ) : (
          users.slice(0, 2).map((u) => <Badge title={u.userName} />)
        )}
        {(users?.length ?? 0) > 2 ? (
          <Text>+{(users?.length ?? 0) - 2}</Text>
        ) : (
          <></>
        )}
      </XStack>
      <View>
        <UpdatedDate updatedAt={updatedAt} />
      </View>
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
    }): {
      users: Observable<User[]>;
      warId: Observable<string>;
      updatedAt: Observable<Date>;
    } => {
      return {
        users: war.users.observe(),
        warId: of(war.id),
        updatedAt: of(war.updatedAt),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(UserInfoEnhanced);

function PlanetLineItemEnhanced({
  planet,
  warId,
  status,
  turn,
}: {
  planet: Planet;
  warId: string;
  status: WarState;
  turn: string;
}) {
  return (
    <XStack flex={1}>
      <H4
        overflow="hidden"
        textOverflow="ellipsis"
        style={{ textWrap: 'nowrap' }}
        flex={1}
        paddingRight="$1"
      >
        {planet.name}
      </H4>
      <View alignItems="center">
        <Status turn={turn} warId={warId} status={status} />
      </View>
    </XStack>
  );
}

const PlanetLineItem = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({
      war,
    }: {
      war: War;
    }): {
      planet: Observable<Planet>;
      warId: Observable<string>;
      turn: Observable<string>;
      status: Observable<string>;
    } => {
      return {
        planet: war.planet.observe(),
        warId: of(war.id),
        turn: war.turn.observe().pipe(map((t) => t?.id ?? null)),
        status: of(war.status),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(PlanetLineItemEnhanced);

function WarLineItem({ war, i }: { war: War; i: number }) {
  const navigate = useNavigate();
  return (
    <XStack
      cursor="pointer"
      onPress={() => navigate(`/war/${war.id}`)}
      width="100%"
      flex={1}
      space="$1"
    >
      <Text alignContent="center">{i + 1}</Text>
      <PlanetLineItem war={war} />
    </XStack>
  );
}

function WarStack({
  wars,
  offset,
  ...rest
}: { wars?: War[]; offset: number } & StackProps) {
  return (
    <YStack {...rest} width="100%" paddingHorizontal="$1" space="$1">
      {wars?.length ? (
        wars.map((w, i) => <WarLineItem war={w} i={i + offset} />)
      ) : (
        <></>
      )}
    </YStack>
  );
}

function Conquest({
  pinned,
  warsWithUser,
  warsWithoutUser,
  numberOfPinned,
  numberOfUnPinnedWarsWithUser,
}: {
  pinned: War[];
  warsWithUser: War[];
  warsWithoutUser: War[];
  scoreboard: { userName: string; score: number }[];
  numberOfPinned: number;
  numberOfUnPinnedWarsWithUser: number;
}) {
  const navigate = useNavigate();
  return (
    <View width="100%" paddingTop="$1" alignItems="center">
      <ResponsiveStack
        space="$1"
        width="100%"
        justifyContent="center"
        id="wars"
        maxWidth="100%"
        alignItems="center"
      >
        {pinned.map((war, i) => (
          <ListItem
            padding="$1"
            borderWidth={1}
            borderRadius={5}
            // borderColor={'white'}
            backgroundColor="transparent"
            margin="0"
            cursor="pointer"
            maxWidth={400}
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
      </ResponsiveStack>
      <View maxWidth={'100%'} width="500px" paddingTop="$1">
        {warsWithUser.length > 0 ? (
          <WarStack
            borderBottomWidth={1}
            // borderColor="gray"
            offset={numberOfPinned}
            wars={warsWithUser}
            paddingBottom="$2"
            marginBottom="$2"
          />
        ) : (
          <></>
        )}
        <WarStack
          offset={numberOfPinned + numberOfUnPinnedWarsWithUser}
          wars={warsWithoutUser}
        />
      </View>
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
      numberOfPinned: Observable<number>;
      numberOfUnPinnedWarsWithUser: Observable<number>;
      pinned: Observable<War[]>;
      warsWithUser: Observable<War[]>;
      warsWithoutUser: Observable<War[]>;
    } => {
      const mostRecentlyUpdated = (
        a: { updatedAt: Date },
        b: { updatedAt: Date }
      ) => {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      };
      const warsWithUser$ = database
        .get<War>('wars')
        .query(Q.on('war_users', Q.where('user_id', userId)))
        .observe()
        .pipe(map((r) => r.sort(mostRecentlyUpdated)));

      const allWars$ = database.get<War>('wars').query().observe();

      const maxPin = 2;

      const pinned$ = warsWithUser$.pipe(map((r) => r.slice(0, maxPin)));
      const unPinnedWarsWithUserS = warsWithUser$.pipe(
        map((r) =>
          r.length === maxPin ? r.slice(0, 0) : r.slice(-(r.length - maxPin))
        )
      );

      return {
        numberOfPinned: pinned$.pipe(map((r) => r?.length ?? 0)),
        numberOfUnPinnedWarsWithUser: unPinnedWarsWithUserS.pipe(
          map((r) => r?.length ?? 0)
        ),
        pinned: pinned$,
        warsWithUser: unPinnedWarsWithUserS,
        warsWithoutUser: combineLatest([warsWithUser$, allWars$]).pipe(
          map(([warsWithUser, allWars]) => {
            const warWithUserIds = new Set(warsWithUser.map((war) => war.id));

            const warsWithoutUser = allWars.filter((war) => {
              return !warWithUserIds.has(war.id);
            });

            return warsWithoutUser.sort(mostRecentlyUpdated);
          })
        ),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(Conquest);
