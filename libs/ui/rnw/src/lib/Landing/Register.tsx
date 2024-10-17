import { Input, XStack, YStack } from 'tamagui';
import * as Typography from '../Typography';
import { PrimaryButton } from '../Display';
import React from 'react';

export function Register() {
  return (
    <YStack space="$0.5" style={{ alignItems: 'center' }}>
      <Typography.H1>end</Typography.H1>
      <YStack width={430} space="$0.5">
        <Input
          placeholder="Username"
          onChange={(e) => {}}
          padding="$0.5"
          width="100%"
        />
        <Input
          placeholder="Password"
          onChange={(e) => {}}
          secureTextEntry={true}
          padding="$0.5"
          width="100%"
          onKeyPress={(event: any) => {}}
        />
        <Input
          placeholder="Confirm Password"
          onChange={(e) => {}}
          secureTextEntry={true}
          padding="$0.5"
          width="100%"
          onKeyPress={(event: any) => {}}
        />
        <PrimaryButton>
          Register
        </PrimaryButton>
      </YStack>
    </YStack>
  );
}
