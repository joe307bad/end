import React, { useCallback, useEffect, useState } from 'react';
import * as Typography from '../Typography';
import { Input, XStack, YStack, Text } from 'tamagui';
import { PrimaryButton } from '../Display';
import { useEndApi } from '@end/data/web';
import { useAuth } from '@end/auth';
import { Toast, useToastController, useToastState } from '@tamagui/toast';
import { execute } from '@end/data/core';

type Props = {
  goToHome?: () => void;
};

const CurrentToast = () => {
  const currentToast = useToastState();

  return (
    <Toast
      key={currentToast?.id}
      duration={currentToast?.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="medium"
      viewportName={currentToast?.viewportName}
    >
      <YStack>
        <Toast.Title>{currentToast?.title}</Toast.Title>
        {!!currentToast?.message && (
          <Toast.Description>{currentToast?.message}</Toast.Description>
        )}
      </YStack>
    </Toast>
  );
};

export function Landing({ goToHome }: Props) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { services } = useEndApi();
  const { setToken } = useAuth();
  const toast = useToastController();

  const login = useCallback(() => {
    setLoading(true);
    execute(services.endApi.login(userName, password))
      .then(async (res) => {
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
      <CurrentToast />
    </YStack>
  );
}
