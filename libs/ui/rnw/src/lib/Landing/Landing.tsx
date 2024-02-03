import React from 'react';
import * as Typography from '../Typography';
import { View, Text } from 'react-native';
import Styles from './Landing.module.scss';
import { Input, XStack, Button, YStack } from 'tamagui';

export function Landing({ goToHome }: { goToHome?: () => void }) {
  return (
    <View id={Styles['landing']}>
      <YStack space="$1">
        <View id={Styles['h1Container']}>
          <Typography.H1>
            <Text
              style={{
                fontFamily: 'ShineTypewriterRegular',
                fontSize: 50,
                color: 'white',
              }}
            >
              end
            </Text>
          </Typography.H1>
        </View>
        <XStack alignItems="center" space="$0.5">
          <Input borderRadius={0} flex={1} />
          <Input borderRadius={0} flex={1} />
          <Button onPress={() => goToHome?.()} borderRadius={0}>
            Login
          </Button>
        </XStack>
      </YStack>
    </View>
  );
}
