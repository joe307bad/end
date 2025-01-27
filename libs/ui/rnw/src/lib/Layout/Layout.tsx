import React, { ComponentType, ReactNode, useCallback, useState } from 'react';
import * as Icons from 'lucide-react-native';
import { Button, H4, Header, View, Text } from 'tamagui';
import { tw } from '../components';
import { useWindowDimensions } from 'react-native';
import * as R from 'remeda';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { Observable, of } from 'rxjs';
import { User, War as TWar } from '@end/wm/core';

function NavButton({
  children,
  navigate,
  currentRoute,
  onPress,
  toggleMenu,
}: {
  children: string;
  currentRoute: string;
  navigate?: (route: string, options?: { replace?: boolean }) => void;
  onPress?: () => void;
  toggleMenu: (open: boolean) => void;
}) {
  const active = `/${children.toLowerCase()}` === currentRoute;
  const { bp } = useResponsive();
  const s = bp(['', '', 'bg-transparent']);

  const style = {
    borderBottomWidth: active ? 2 : 0,
    // borderColor: 'white',
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    ...s,
  };

  return (
    <Button
      style={style}
      hoverStyle={style}
      pressStyle={style}
      borderRadius={0}
      onPress={() => {
        onPress ? onPress() : navigate?.(`/${children.toLowerCase()}`);
        toggleMenu(false);
      }}
    >
      {children}
    </Button>
  );
}

export function useResponsive(rerender?: boolean, max?: number) {
  const { width } = useWindowDimensions();

  const bp = useCallback(
    (bps: [common: string, sm?: string, md?: string, lg?: string]) => {
      const [common, sm, md, lg] = bps;

      const styles = (() => {
        if (width > (max ?? 1000)) {
          return [lg, md].join(' ');
        }

        if (width > (max ?? 800)) {
          return md;
        }

        return sm;
      })();

      const s = `${common} ${!R.isEmpty(styles) ? styles : ''}`;

      // @ts-ignore
      return tw.style(s);
    },
    [rerender, width, max]
  );

  return {
    bp,
  };
}

function UserNameEnhanced({ user }: { user: User }) {
  return user.userName;
}

const UserName = compose(
  withDatabase,
  withObservables(
    ['userId'],
    ({
      database,
      userId,
    }: {
      database: Database;
      userId: string;
    }): { user: Observable<User> } => {
      return {
        user: database.get<User>('users').findAndObserve(userId),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(UserNameEnhanced);

export function ContainerWithNav({
  children,
}: {
  children: ReactNode;
  currentRoute: string;
  navigate?: (route: string, options?: { replace?: boolean }) => void;
  logOut?: () => void;
  title?: string;
  userId?: string;
}) {

  return children;
}
