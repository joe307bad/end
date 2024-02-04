import React from 'react';
import * as Typography from '../Typography';
import { Input, XStack, Button, YStack } from 'tamagui';

export function Landing({ goToHome }: { goToHome?: () => void }) {
  return (
    <YStack space="$0.5" style={{ alignItems: 'center' }}>
      <Typography.H1>end</Typography.H1>
      <XStack space="$0.5">
        <Input padding="$0.5" width="50%" />
        <Input padding="$0.5" width="50%" />
      </XStack>
      <Button
        onPress={() => goToHome?.()}
        borderRadius={0}
        width="100%"
        padding={0}
      >
        Login
      </Button>
    </YStack>
  );
}
