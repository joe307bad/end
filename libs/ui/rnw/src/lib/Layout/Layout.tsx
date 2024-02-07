import React, { ReactNode } from 'react';
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

function useResponsive() {
  const { height, width } = useWindowDimensions();

  return {
    bp: (bps: [common: string, sm?: string, md?: string, lg?: string]) => {
      const [common, sm, md, lg] = bps;

      const styles = (() => {
        if (height > 1000) {
          return lg;
        }

        if (height > 800) {
          return md;
        }

        return sm;
      })();

      const s = `${common} ${!R.isEmpty(styles) ? styles : ''}`
      // @ts-ignore
      return tw.style(s);
    },
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
  const { bp } = useResponsive();
  return (
    <View style={{ display: 'flex', alignItems: 'center' }}>
      <MenuSquare size="$2" style={bp(['', '', 'hidden'])} />
      <View style={{ width: 500, maxWidth: '100%' }}>
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
        {children}
      </View>
    </View>
  );
}
