import React, { useCallback, useState } from 'react';
import * as Typography from '../Typography';
import { Input, XStack, YStack, Text } from 'tamagui';
import { PrimaryButton } from '../Display';
import { useEndApi } from '@end/data';
import { useAuth } from '@end/auth';

type Props = {
  goToHome?: () => void;
};

export function Landing({ goToHome }: Props) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { EndApi } = useEndApi();
  const { setToken } = useAuth();

  const login = useCallback(() => {
    setLoading(true);
    EndApi.login(userName, password).then(async (res: Response) => {
      setLoading(false);
      const json: { access_token: string } = await res.json();
      if (json?.access_token) {
        setToken(json.access_token);
        goToHome?.();
      }
    });
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
