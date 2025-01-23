import React from 'react';
import { H1, View, XStack } from 'tamagui';

export function Nav({ children }: { children: JSX.Element }) {
  return (
    <XStack height="100%">
      <View height="100%">
        <H1>Side nav</H1>
      </View>
      <View height="100%">
        <View>
          <H1>Header</H1>
        </View>
        {children}
      </View>
    </XStack>
  );
}
