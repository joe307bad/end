import React, { ReactNode } from 'react';
import { Button, Header, View, XStack } from 'tamagui';

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

export function Container({
  children,
  navigate,
  currentRoute,
}: {
  children: ReactNode;
  currentRoute: string;
  navigate: (route: string, options: { replace: boolean }) => void;
}) {
  return (
    <View style={{ display: 'flex', alignItems: 'center' }}>
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
