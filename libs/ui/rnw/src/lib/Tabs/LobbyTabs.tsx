import { Text, View } from 'tamagui';
import React, { useCallback } from 'react';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { UserCircle2 } from '@tamagui/lucide-icons';
import { PrimaryButton } from '../Display';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';

export function LobbyTabs() {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const params = useParams();

  const join = useCallback(async () => {
    await execute(
      services.conquestService.addPlayer({ warId: params['id'] ?? '' })
    );
  }, []);

  return (
    <View
      flexDirection="column"
      borderRadius={5}
      borderWidth={1}
      maxHeight={'100%'}
      height="100%"
      overflow="hidden"
      borderColor="$borderColor"
      backgroundColor="black"
      padding="$1"
    >
      <View flex={1} space="$1">
        {warStore.players.map(([userId, userName], i) => (
          <View
            key={`${userId}_${i}`}
            flexDirection="row"
            alignItems="center"
            space="$1"
          >
            <View>
              <UserCircle2 />
            </View>
            <Text flex={1}>{userName}</Text>
            <Text
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              width={100}
            >
              {userId}
            </Text>
          </View>
        ))}
      </View>
      <View paddingTop="$1" width="100%">
        <View width={100} alignSelf="flex-end">
          <PrimaryButton onPress={join}>Join</PrimaryButton>
        </View>
      </View>
    </View>
  );
}
