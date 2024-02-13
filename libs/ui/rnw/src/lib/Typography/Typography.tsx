import * as t from 'tamagui';
import React, { ReactNode } from 'react';
import { Text } from 'react-native';

export function H1({ children }: { children?: ReactNode }): ReactNode {
  return (
    <t.H1 style={{ fontFamily: 'ShineTypewriterRegular' }}>
      <Text
        style={{
          fontFamily: 'ShineTypewriterRegular',
          fontSize: 50,
          color: 'white',
        }}
      >
        {children}
      </Text>
    </t.H1>
  );
}
