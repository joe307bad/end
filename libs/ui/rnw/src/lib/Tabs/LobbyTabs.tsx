import { Text, View } from 'tamagui';
import React, { useCallback } from 'react';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { UserCircle2 } from 'lucide-react-native';
import { PrimaryButton } from '@end/ui/shared';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { pipe } from 'effect';

export function LobbyTabs() {
  const { services } = useEndApi();
  const { warService, syncService } = services;
  const warStore = useSnapshot(warService.store);
  const params = useParams();

  const join = useCallback(async () => {
    await execute(
      pipe(
        services.conquestService.addPlayer({ warId: params['id'] ?? '' })
        // Effect.flatMap(syncService.sync)
      )
    );
  }, []);

  const beginTurnNumber1 = useCallback(async () => {
    await execute(pipe(services.conquestService.beginTurnNumber1()));
  }, []);

  return (
    <View
      flexDirection="column"
      borderRadius={5}
      borderWidth={1}
      maxHeight={'100%'}
      height="100%"
      overflow="hidden"
      // borderColor="$borderColor"
      backgroundColor="black"
      padding="$1"
    >
      <View flex={1} space="$1">
        {warStore.players.map(({ id, userName, color }, i) => (
          <View
            key={`${id}_${i}`}
            flexDirection="row"
            alignItems="center"
            space="$1"
          >
            <View>
              <UserCircle2 color={color} />
            </View>
            <Text flex={1}>{userName}</Text>
            <Text
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              width={100}
            >
              {id}
            </Text>
          </View>
        ))}
      </View>
      <View paddingTop="$1" width="100%">
        {warStore.players.length > 1 && (
          <View width={100} alignSelf="flex-start">
            <PrimaryButton onPress={beginTurnNumber1}>Start</PrimaryButton>
          </View>
        )}
        {!warStore.players.find((p) => p.id === warStore.userId) && (
          <View width={100} alignSelf="flex-end">
            <PrimaryButton onPress={join}>Join</PrimaryButton>
          </View>
        )}
      </View>
    </View>
  );
}
