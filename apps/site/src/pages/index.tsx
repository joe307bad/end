import React, { useEffect, useState } from 'react';
import { PrimaryButton, Badge, Logo } from '@end/ui/shared';
import { H1, View, YStack, Text, H3, XStack } from 'tamagui';
import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export function Index({ version, sha }: { version: string; sha: string }) {
  return (
    <View height="100%" justifyContent="center" alignItems="center">
      <YStack gap="$2" alignItems="center" maxWidth="100%" width={800}>
        <Logo Hexagon={Hexagon} />
        <View maxWidth="100%" width={500}>
          <H3 letterSpacing={1} fontWeight="300" textAlign="center">
            <Text fontWeight="900">end</Text> is the codename for a strategy
            game focused on conquest and interactive fiction.
          </H3>
        </View>
        <View maxWidth="100%"  width={500}>
          <XStack justifyContent="center" width="100%" gap="$1">
            <PrimaryButton width="30%">About</PrimaryButton>
            <Link style={{ display: 'block', width: "30%" }} href="/app">
              <PrimaryButton >Play</PrimaryButton>
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
