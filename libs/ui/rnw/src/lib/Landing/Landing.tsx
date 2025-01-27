import React, { useCallback, useEffect, useState } from 'react';
import { Input, View, XStack, YStack } from 'tamagui';
import { Badge, Logo, PrimaryButton } from '@end/ui/shared';
import { useAuth } from '@end/auth';
import { useToastController } from '@tamagui/toast';
import { execute, servicesFactory } from '@end/data/core';
import { CurrentToast } from '../components';
import { Hexagon } from 'lucide-react-native';

type Props = {
  goToHome?: () => void;
  goToRegister?: () => void;
  services: ReturnType<typeof servicesFactory>;
  version?: string;
  sha?: string;
};

export function Landing({
  goToHome,
  goToRegister,
  services,
  version,
  sha,
}: Props) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const toast = useToastController();

  const login = useCallback(() => {
    setLoading(true);
    execute(services.endApi.login(userName, password))
      .then(async (res: any) => {
        setLoading(false);
        if (res?.access_token) {
          await setToken(res.access_token);
          goToHome?.();
        } else {
          toast.show('An error occurred. Try again.', {
            message: (res as any)?.message,
          });
        }
      })
      .catch((e) => {
        setLoading(false);
        // toast.show('An error occurred. Try again.', { message: e?.message });
      });
  }, [userName, password]);

  useEffect(() => {
    toast.hide();
  }, []);

  return (
    <YStack alignItems="center" height="100%" padding="$0.5" space="$0.5">
      <View margin="$2">
        <Logo Hexagon={Hexagon} />
      </View>
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
          onKeyPress={(event: any) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
              login();
            }
          }}
        />
      </XStack>
      <PrimaryButton loading={loading} onPress={login}>
        Login
      </PrimaryButton>
      <View alignContent="center" margin="$1">
        <Badge color="purple" title={version} />
      </View>
      <View flex={1} width="100%" justifyContent="flex-end">
        <PrimaryButton onPress={goToRegister}>Register</PrimaryButton>
      </View>
      <CurrentToast />
    </YStack>
  );
}
