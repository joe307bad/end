import {
  Text,
  View,
  H3,
  H2,
  H4,
  XStack,
  YStack,
  ListItem,
  Spinner,
} from 'tamagui';
import React, { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Trophy } from '@tamagui/lucide-icons';
import { Badge, getReadableDate } from '@end/components';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio/react';
import { toPairs } from 'remeda';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Planet, User, War } from '@end/wm/core';
import { map, Observable, of } from 'rxjs';
import { IUser } from '@end/war/core';
import { Database, Q } from '@nozbe/watermelondb';

function BattleWinRate({
  total,
  won,
  user,
  change,
  trophyColor,
}: {
  user: string;
  total: number;
  won: number;
  change: number;
  trophyColor: string;
}) {
  const readableChange = Math.round(change * 100 * 10) / 10;
  return (
    <ListItem
      maxHeight="100%"
      minHeight={0}
      padding={0}
      backgroundColor="transparent"
      margin={0}
      cursor="pointer"
      maxWidth={400}
      icon={
        <View>
          <Trophy color={trophyColor} size="$2" width={30} />
        </View>
      }
      title={
        <Text flex={1}>
          <UserInfo userId={user} />
        </Text>
      }
      iconAfter={
        <XStack alignItems="center" space="$0.5">
          <Text>
            {won}-{total - won}
          </Text>
          <Text>•</Text>
          <Text>{(won / total).toFixed(3)}</Text>
          <Badge
            color={readableChange < 0 ? 'red' : 'green'}
            title={`${readableChange > 0 ? '+' : ''}${readableChange}%`}
          />
        </XStack>
      }
    />
  );
}

function UserInfoEnhanced({ user }: { user: User }) {
  return user.userName;
}

const UserInfo = compose(
  withDatabase,
  withObservables(
    ['userId'],
    ({
      database,
      userId,
    }: {
      database: Database;
      userId: string;
    }): {
      user: Observable<User>;
    } => {
      return {
        user: database.get<User>('users').findAndObserve(userId),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(UserInfoEnhanced);

function WarInfoEnhanced({ user, summary }: { user: User; summary: string }) {
  return (
    <>
      <H3 paddingBottom="$1">
        <H3>{user.userName}</H3>
      </H3>
      <XStack>
        <Text flex={1}>{summary}</Text>
      </XStack>
    </>
  );
}

const WarInfo = compose(
  withDatabase,
  withObservables(
    ['war'],
    ({
      war,
    }: {
      war: War;
    }): {
      user: Observable<User>;
      summary: Observable<string>;
    } => {
      return {
        user: war.victor.observe(),
        summary: war.planet
          .observe()
          .pipe(
            map(
              (planet) =>
                `Conquered ${planet.name} ${getReadableDate(war.createdAt)}`
            )
          ),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(WarInfoEnhanced);

function CitadelEnhanced({ wars }: { wars: War[] }) {
  const navigate = useNavigate();
  const { services: s } = useEndApi();
  const store = useSnapshot(s.endApi.store);

  if (store.citadel === 'fetching') {
    return <Spinner margin="$2" />;
  }

  if (store.citadel === null) {
    return <H3>Error loading Citadel</H3>;
  }

  const citadel = store.citadel;

  return (
    <XStack
      justifyContent="center"
      alignItems="flex-start"
      space="$2"
      width="100%"
      paddingTop="$1"
    >
      <View width={500}>
        <H2 paddingBottom="$1">Latest victors</H2>
        <YStack space="$1">
          {wars.map((war) => (
            <View
              onPress={() => navigate(`/war/${war.id}`)}
              padding="$1"
              borderWidth={1}
              borderRadius={5}
              borderColor={'white'}
              backgroundColor="transparent"
              margin="0"
              cursor="pointer"
            >
              <WarInfo war={war} />
            </View>
          ))}
        </YStack>
      </View>
      <YStack width={500} space="$3">
        <View>
          <H2 paddingBottom="$1">Battle win rate leaders</H2>
          <YStack space="$1">
            {toPairs(citadel.leaderboards?.battleWinRate ?? {})
              .slice(0, 3)
              .map(([user, bwr], i) => {
                const trophyColor = (() => {
                  switch (i) {
                    case 0:
                      return 'gold';
                    case 1:
                      return 'silver';
                    default:
                      return 'brown';
                  }
                })();
                return (
                  <BattleWinRate
                    user={user}
                    total={bwr.totalBattles}
                    won={bwr.battlesWon}
                    change={bwr.change}
                    trophyColor={trophyColor}
                  />
                );
              })}
          </YStack>
        </View>

        <View>
          <H2 paddingBottom="$1">Most captured planets</H2>
          <YStack>
            {toPairs(citadel.leaderboards?.totalPlanetsCaptured ?? {})
              .slice(0, 3)
              .map(([user, captured]) => (
                <ListItem
                  minHeight={0}
                  padding={0}
                  backgroundColor="transparent"
                  margin={0}
                  cursor="pointer"
                  maxWidth={400}
                  icon={
                    <View>
                      <Trophy color="gold" size="$2" />
                    </View>
                  }
                  title={
                    <Text>
                      <UserInfo userId={user} />
                    </Text>
                  }
                  iconAfter={<Text>{captured.value}</Text>}
                />
              ))}
          </YStack>
        </View>
      </YStack>
    </XStack>
  );
}

export const Citadel = compose(
  withDatabase,
  withObservables(
    [],
    ({
      database,
    }: {
      database: Database;
    }): {
      wars: Observable<War[]>;
    } => {
      return {
        wars: database
          .get<War>('wars')
          .query(Q.where('victor_id', Q.notEq('')))
          .observe()
          .pipe(map((r) => (r ?? []).slice(0, 5))),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(CitadelEnhanced);
