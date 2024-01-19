import * as t from 'tamagui';
import { ReactNode } from 'react';
import Styles from './Typography.module.scss'

export function H1({ children }: { children?: ReactNode }): ReactNode {
  return <t.H1 id={Styles.h1}>{children}</t.H1>;
}
