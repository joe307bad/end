import React, { useCallback, useState } from 'react';
import * as Typography from '../Typography';
import { Input, View, XStack, YStack } from 'tamagui';
import { PrimaryButton } from '../Display';
import { useAuth } from '@end/auth';
import { Toast, useToastController, useToastState } from '@tamagui/toast';
import { execute, servicesFactory } from '@end/data/core';
import { CurrentToast } from '../components';

type Props = {
  goToHome?: () => void;
  goToRegister?: () => void;
  services: ReturnType<typeof servicesFactory>;
};

export function Landing({ goToHome, goToRegister, services }: Props) {
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
        toast.show('An error occurred. Try again.', { message: e?.message });
      });
  }, [userName, password]);

  return (
    <YStack space="$0.5" style={{ alignItems: 'center' }} height="100%">
      <View paddingTop="$1" paddingBottom="$1" display="flex" height="100%">
        <YStack space="$0.5" flex={1}>
          <View display="flex" alignItems="center">
            <Typography.H1>end</Typography.H1>
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
        </YStack>
        <PrimaryButton onPress={goToRegister}>Register</PrimaryButton>
        <CurrentToast />
      </View>
    </YStack>
  );
}
