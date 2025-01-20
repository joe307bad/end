import { Text, View, H3, H2, XStack, YStack, ListItem, Spinner } from 'tamagui';
import React, { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react-native';
import { ResponsiveStack } from '@end/components';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio/react';
import { toPairs } from 'remeda';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { User } from '@end/wm/core';
import { Observable } from 'rxjs';
import { Database, Q } from '@nozbe/watermelondb';
import { getReadableDate } from '@end/war/core';
import { Badge } from '@end/ui/shared';

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
  const formatted = Math.round(change * 100 * 10) / 10;
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
          {formatted !== 0 ? (
            <Badge
              color={formatted < 0 ? 'red' : 'green'}
              title={`${formatted > 0 ? '+' : ''}${formatted}%`}
            />
          ) : null}
          <Text width={40} textAlign="right">
            {won}-{total - won}
          </Text>
          <Text>•</Text>
          <Text>{(won / total).toFixed(3)}</Text>
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

function WarInfo({
  war,
}: {
  war: {
    userName: string;
    summary: string;
    completed: number;
  };
}) {
  return (
    <>
      <H3 paddingBottom="$1">
        <H3>{war.userName}</H3>
      </H3>
      <XStack>
        <Text flex={1}>
          Conquered {war.summary} {getReadableDate(new Date(war.completed))}
        </Text>
      </XStack>
    </>
  );
}

export function Citadel() {
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

  const trophyColor = (index: number) => {
    switch (index) {
      case 0:
        return 'gold';
      case 1:
        return 'silver';
      default:
        return 'brown';
    }
  };

  return (
    <ResponsiveStack
      justifyContent="center"
      alignItems="flex-start"
      space="$2"
      width="100%"
      paddingTop="$1"
      paddingBottom="$1"
      mobileProps={{flexDirection: 'column-reverse'}}
    >
      <View maxWidth="100%" width={500}>
        <H2 paddingBottom="$1">Latest victors</H2>
        <YStack space="$1">
          {citadel.latestWars?.map((war) => (
            <View
              onPress={() => navigate(`/war/${war.warId}`)}
              padding="$1"
              borderWidth={1}
              borderRadius={5}
              // borderColor={'white'}
              backgroundColor="transparent"
              margin="0"
              cursor="pointer"
            >
              <WarInfo war={war} />
            </View>
          ))}
        </YStack>
      </View>
      <YStack maxWidth="100%" width={500} space="$3">
        <View>
          <H2 paddingBottom="$1">Battle win rate leaders</H2>
          <YStack space="$1">
            {toPairs(citadel.leaderboards?.battleWinRate ?? {})
              .slice(0, 3)
              .map(([user, bwr], i) => {
                return (
                  <BattleWinRate
                    user={user}
                    total={bwr.totalBattles}
                    won={bwr.battlesWon}
                    change={bwr.change}
                    trophyColor={trophyColor(i)}
                  />
                );
              })}
          </YStack>
        </View>
        <View>
          <H2 paddingBottom="$1">Most captured planets</H2>
          <YStack space="$1">
            {toPairs(citadel.leaderboards?.totalPlanetsCaptured ?? {})
              .slice(0, 3)
              .map(([user, captured], i) => (
                <ListItem
                  minHeight={0}
                  padding={0}
                  backgroundColor="transparent"
                  margin={0}
                  cursor="pointer"
                  maxWidth={400}
                  icon={
                    <View>
                      <Trophy width={30} color={trophyColor(i)} size="$2" />
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
    </ResponsiveStack>
  );
}
