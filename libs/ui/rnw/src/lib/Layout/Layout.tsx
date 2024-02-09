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
}: {
  children: string;
  currentRoute: string;
  navigate: (route: string, options: { replace: boolean }) => void;
}) {
  const active = `/${children.toLowerCase()}` === currentRoute;

  const style = {
    borderBottomWidth: active ? 2 : 0,
    borderColor: 'white',
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  };

  return (
    <Button
      backgroundColor={'transparent'}
      style={style}
      hoverStyle={style}
      pressStyle={style}
      borderRadius={0}
      onPress={() => navigate(`/${children.toLowerCase()}`, { replace: true })}
    >
      {children}
    </Button>
  );
}

function useResponsive(rerender?: any) {
  const { width } = useWindowDimensions();

  const bp = useCallback(
    (bps: [common: string, sm?: string, md?: string, lg?: string]) => {
      const [common, sm, md, lg] = bps;

      const styles = (() => {
        if (width > 1000) {
          return [lg, md].join(' ');
        }

        if (width > 800) {
          return md;
        }

        return sm;
      })();

      const s = `${common} ${!R.isEmpty(styles) ? styles : ''}`;

      // @ts-ignore
      return tw.style(s);
    },
    [rerender, width]
  );

  return {
    bp,
  };
}

export function ContainerWithNav({
  children,
  navigate,
  currentRoute,
}: {
  children: ReactNode;
  currentRoute: string;
  navigate: (route: string, options: { replace: boolean }) => void;
}) {
  const [menuOpen, toggleMenu] = useState<boolean>(false);
  const { bp } = useResponsive(menuOpen);

  return (
    <View style={{ display: 'flex', alignItems: 'center' }}>
      <View style={bp(['w-full items-end'])}>
        <View onPress={() => toggleMenu((prevState) => !prevState)}>
          <MenuSquare size="$2" style={bp(['block p-2', '', 'hidden'])} />
        </View>
      </View>
      <View style={{ width: 500, maxWidth: '100%' }}>
        <View style={bp(['', `${menuOpen ? '' : 'hidden'}`, ''])}>
          <Header style={{ alignItems: 'center' }}>
            <XStack alignItems="center">
              <NavButton currentRoute={currentRoute} navigate={navigate}>
                Home
              </NavButton>
              <NavButton currentRoute={currentRoute} navigate={navigate}>
                Story
              </NavButton>
              <NavButton currentRoute={currentRoute} navigate={navigate}>
                Economy
              </NavButton>
              <NavButton currentRoute={currentRoute} navigate={navigate}>
                Conquest
              </NavButton>
            </XStack>
          </Header>
        </View>
        {children}
      </View>
    </View>
  );
}
