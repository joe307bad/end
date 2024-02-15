import React, { useCallback, useState } from 'react';
import * as Typography from '../Typography';
import { Input, XStack, YStack } from 'tamagui';
import { PrimaryButton } from '../Display';
import { EndApi } from '@end/data';

export function Landing({ goToHome }: { goToHome?: () => void }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(() => {
    const api = new EndApi('http://localhost:3000/api');
    setLoading(true);
    api.login(userName, password).then(() => setLoading(false));
  }, [userName, password]);

  return (
    <YStack space="$0.5" style={{ alignItems: 'center' }}>
      <Typography.H1>end</Typography.H1>
      <XStack space="$0.5">
        <Input
          placeholder="Username"
          onChange={(e) => setUserName(e.nativeEvent.text)}
          padding="$0.5"
          width="50%"
        />
        <Input
          placeholder="Password"
          onChange={(e) => setPassword(e.nativeEvent.text)}
          secureTextEntry={true}
          padding="$0.5"
          width="50%"
        />
      </XStack>
      <PrimaryButton loading={loading} onPress={login}>
        Login
      </PrimaryButton>
    </YStack>
  );
}
