import React from 'react';
import * as Typography from '../Typography';
import { Input, XStack, YStack } from 'tamagui';
import { PrimaryButton } from '../Display/Button';

export function Landing({ goToHome }: { goToHome?: () => void }) {
  return (
    <YStack space="$0.5" style={{ alignItems: 'center' }}>
      <Typography.H1>end</Typography.H1>
      <XStack space="$0.5">
        <Input placeholder="Username" padding="$0.5" width="50%" />
        <Input
          placeholder="Password"
          secureTextEntry={true}
          padding="$0.5"
          width="50%"
        />
      </XStack>
      <PrimaryButton>Login</PrimaryButton>
    </YStack>
  );
}
