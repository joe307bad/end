import { Anchor, Input, View, YStack, Text } from 'tamagui';
import { Callout, Logo, PrimaryButton } from '@end/ui/shared';
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
  const [code, setCode] = useState('');
  const toast = useToastController();
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    toast.hide();
  }, []);

  const register = useCallback(() => {
    setLoading(true);
    execute(services.endApi.register(userName, password, confirmPassword, code))
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
  }, [userName, password, confirmPassword, code]);

  return (
    <YStack
      width="100%"
      padding="$0.5"
      space="$0.5"
      style={{ alignItems: 'center' }}
    >
      <View margin="$2">
        <Logo Hexagon={Hexagon} />
      </View>
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
        <Callout type="warning">
          <Text>
            Void is currently in closed alpha. You need a code to register. If
            you are interested in being a part of the early void universe,
            please DM me on X{' '}
            <Anchor
              borderBottomWidth="$0.5"
              borderColor="white"
              href="https://x.com/joe307bad"
            >
              @joe307bad
            </Anchor>
            .
          </Text>
        </Callout>
        <Input
          placeholder="Code"
          onChange={(e) => setCode(e.nativeEvent.text)}
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
