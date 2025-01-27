import { Input, YStack } from 'tamagui';
import { Logo, PrimaryButton } from '@end/ui/shared';
import React, { useCallback, useEffect, useState } from 'react';
import { execute, servicesFactory } from '@end/data/core';
import { useToastController } from '@tamagui/toast';
import { useAuth } from '@end/auth';
import { CurrentToast } from '../components';
import { Hexagon } from 'lucide-react-native';

export function Register({
  goToHome,
  services,
}: {
  goToHome?: () => void;
  services: ReturnType<typeof servicesFactory>;
}) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const toast = useToastController();
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    toast.hide();
  }, []);

  const register = useCallback(() => {
    setLoading(true);
    execute(services.endApi.register(userName, password, confirmPassword))
      .then(async (res: any) => {
        setLoading(false);
        if (res?.access_token) {
          await setToken(res.access_token);
          goToHome?.();
        } else {
          // toast.show('An error occurred. Try again.', {
          //   message: (res as any)?.message,
          // });
        }
      })
      .catch((e) => {
        setLoading(false);
        // toast.show('An error occurred. Try again.', { message: e?.message });
      });
  }, [userName, password, confirmPassword]);

  return (
    <YStack
      width="100%"
      padding="$0.5"
      space="$0.5"
      style={{ alignItems: 'center' }}
    >
      <Logo Hexagon={Hexagon} />
      <YStack maxWidth={438} width="100%" space="$0.5">
        <Input
          placeholder="Username"
          onChange={(e) => setUserName(e.nativeEvent.text)}
          padding="$0.5"
        />
        <Input
          placeholder="Password"
          onChange={(e) => setPassword(e.nativeEvent.text)}
          secureTextEntry={true}
          padding="$0.5"
          onKeyPress={(event: any) => {}}
        />
        <Input
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.nativeEvent.text)}
          secureTextEntry={true}
          padding="$0.5"
          onKeyPress={(event: any) => {}}
        />
        <PrimaryButton loading={loading} onPress={register}>
          Register
        </PrimaryButton>
        <CurrentToast />
      </YStack>
    </YStack>
  );
}
