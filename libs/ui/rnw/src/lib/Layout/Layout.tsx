import React, { ReactNode, useCallback, useState } from 'react';
import { MenuSquare } from '@tamagui/lucide-icons';
import { Button, Header, View, XStack } from 'tamagui';
import { tw } from '../components';
import { useWindowDimensions } from 'react-native';
import * as R from 'remeda';

function NavButton({
  children,
  navigate,
  currentRoute,
  onPress,
}: {
  children: string;
  currentRoute: string;
  navigate?: (route: string, options?: { replace?: boolean }) => void;
  onPress?: () => void;
}) {
  const active = `/${children.toLowerCase()}` === currentRoute;
  const { bp } = useResponsive();
  const s = bp(['', '', 'bg-transparent']);

  const style = {
    borderBottomWidth: active ? 2 : 0,
    borderColor: 'white',
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
      onPress={() =>
        onPress ? onPress() : navigate?.(`/${children.toLowerCase()}`)
      }
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

export function ContainerWithNav({
  children,
  navigate,
  currentRoute,
  logOut,
}: {
  children: ReactNode;
  currentRoute: string;
  navigate?: (route: string, options?: { replace?: boolean }) => void;
  logOut?: () => void;
}) {
  const [menuOpen, toggleMenu] = useState<boolean>(false);
  const { bp } = useResponsive(menuOpen);

  return (
    <View style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <View style={bp(['w-full items-end'])}>
        <View onPress={() => toggleMenu((prevState) => !prevState)}>
          <MenuSquare size="$2" style={bp(['block p-2 ', '', 'hidden'])} />
        </View>
      </View>
      <View
        style={bp([
          '',
          `${menuOpen ? '' : 'hidden'} absolute right-0 top-12`,
          '',
        ])}
      >
        <Header style={tw`z-1`}>
          <View style={bp(['flex flex-column', '', 'flex-row'])}>
            <NavButton currentRoute={currentRoute} navigate={navigate}>
              Home
            </NavButton>
            <NavButton currentRoute={currentRoute} onPress={logOut}>
              Logout
            </NavButton>
          </View>
        </Header>
      </View>
      <View id="content" style={tw.style('flex items-center w-full flex-1')}>
        <View style={tw.style('w-[500px] w-full h-full')}>{children}</View>
      </View>
    </View>
  );
}
