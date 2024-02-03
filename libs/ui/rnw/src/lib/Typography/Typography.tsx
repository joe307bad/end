import * as t from 'tamagui';
import React, { ReactNode } from 'react';

export function H1({ children }: { children?: ReactNode }): ReactNode {
  return (
    <t.H1 style={{ fontFamily: 'ShineTypewriterRegular' }}>{children}</t.H1>
  );
}
