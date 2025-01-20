import React from 'react';
import { PrimaryButton, Badge } from '@end/ui/shared';
import { H1, View, YStack } from 'tamagui';

export function Index({ version, sha }: { version: string; sha: string }) {
  return (
    <View height="100%" justifyContent="center" alignContent="center">
      <YStack width={500}>
        <H1>This is the end | hey there! 645456</H1>
        <PrimaryButton>Login</PrimaryButton>
        <Badge
          color="purple"
          title={`${version ?? '0.0.0'} | ${sha ?? '~commit sha~'}`}
        />
      </YStack>
    </View>
  );
}

export async function getStaticProps() {
  return {
    props: {
      version: process?.env?.END_VERSION ?? null,
      sha: process?.env?.END_COMMIT_SHA ?? null,
    },
  };
}

export default Index;
