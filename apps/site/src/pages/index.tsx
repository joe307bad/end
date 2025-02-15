import React, { useEffect, useState } from 'react';
import { PrimaryButton, Badge, Logo } from '@end/ui/shared';
import { H1, View, YStack, Text, H3, XStack } from 'tamagui';
import Link from 'next/link';
// import { Hexagon } from 'lucide-react';
import Hexagon from '@mui/icons-material/Hexagon';

export function Index({ version, sha }: { version: string; sha: string }) {
  return (
    <View height="100%" justifyContent="center" alignItems="center">
      <YStack gap="$2" alignItems="center" maxWidth="100%" width={800}>
        <Logo Hexagon={Hexagon} />
        <Text
          maxWidth="100%"
          width={370}
          borderColor="#686868"
          borderStyle="dotted"
          borderWidth={1}
          padding="$1"
        >
          void is the codename for a strategy game focused on conquest and
          interactive fiction.
        </Text>
        <View maxWidth="100%" width={370}>
          <XStack justifyContent="center" width="100%" gap="$1">
            <Link style={{ display: 'block', flex: 1 }} href="/about">
              <PrimaryButton>About</PrimaryButton>
            </Link>
            <Link style={{ display: 'block', flex: 1 }} href="/app">
              <PrimaryButton>Play</PrimaryButton>
            </Link>
          </XStack>
        </View>
        <Link href={`https://github.com/joe307bad/end/releases/tag/${version}`}>
          <Badge color="purple" title={`${version ?? '0.0.0'}`} />
        </Link>
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
