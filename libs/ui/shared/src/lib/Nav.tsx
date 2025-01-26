import React, { useState } from 'react';
import {
  H1,
  View,
  XStack,
  YStack,
  Text,
  Separator,
  H5,
  useMedia,
} from 'tamagui';
import { groupBy, prop } from 'remeda';
import { Badge } from './Badge';
import MenuSharp from '@mui/icons-material/MenuSharp';
import MenuOpen from '@mui/icons-material/CloseSharp';

function Item({
  route,
  activePage,
  onPress,
}: {
  route: {
    url: string;
    title: string;
    type: string;
  };
  onPress: () => void;
  activePage?: string | null;
}) {
  return (
    <XStack onPress={onPress}>
      {activePage === route.url ? (
        <Text position="absolute" marginTop={2.5}>
          ⬥
        </Text>
      ) : null}
      <View
        transition="padding-left 0.1s"
        cursor="pointer"
        marginVertical="$0.5"
        paddingLeft="$1"
        paddingBottom={1}
        overflow="hidden"
        height={27}
      >
        <Text hoverStyle={{ borderBottomWidth: 1 }}>{route.title}</Text>
      </View>
    </XStack>
  );
}

export function Nav({
  full,
  routes,
  activePage = null,
  title,
  children,
  navigate,
  menuOpen,
  toggleMenu,
}: {
  full?: boolean;
  menuOpen: boolean;
  toggleMenu: (value: ((prevState: boolean) => boolean) | boolean) => void;
  navigate: (route: string) => void;
  title?: string;
  activePage?: string | null;
  children: JSX.Element;
  routes: { title: string; url: string; type: string }[];
}) {
  const grouped = groupBy<{ type: string; title: string; url: string }>(
    // @ts-ignore
    routes as const,
    prop('type')
  );
  const media = useMedia();

  return (
    <XStack
      paddingHorizontal={media['sm'] ? '$1' : 0}
      height="100%"
      width="100%"
    >
      <YStack
        flex={1}
        alignItems="center"
        width="100%"
        height="100%"
      >
        {!full ? (
          <H1
            maxWidth="100%"
            width={500}
            paddingTop="$1"
            letterSpacing="$5"
            fontWeight="$6"
          >
            {title}
          </H1>
        ) : null}
        <View maxWidth="100%" height="100%" width={full ? '100%' : 500}>
          {children}
        </View>
      </YStack>
      <View
        position={media['sm'] ? 'absolute' : 'relative'}
        right={0}
        maxHeight="100%"
        height="100%"
      >
        <View
          onPress={() => toggleMenu((prev: boolean) => !prev)}
          cursor="pointer"
          padding="$1"
          position="absolute"
          backgroundColor="black"
          zIndex={9}
          right={menuOpen ? 200 : 0}
          top={-2}
        >
          {menuOpen ? <MenuOpen /> : <MenuSharp />}
        </View>
        <YStack
          height="100%"
          maxHeight="100%"
          width={200}
          borderStyle="dotted"
          borderLeftWidth={1}
          borderRightWidth={0}
          borderTopWidth={0}
          borderBottomWidth={0}
          padding="$1"
          borderColor="gray"
          backgroundColor="black"
          display={menuOpen ? 'flex' : 'none'}
        >
          <View minHeight="auto" flex={1}>
            {grouped['app'].map((route) => (
              <Item
                onPress={() => navigate(route.url)}
                route={route}
                activePage={activePage}
              />
            ))}
            <Separator
              marginVertical="$3"
              borderStyle="dotted"
              borderColor="gray"
            />
          </View>
          {Object.keys(grouped).map((t) => (
            <YStack display="flex">
              {(() => {
                switch (t) {
                  case 'app':
                    return null;
                  case 'Page':
                    return (
                      <YStack>
                        {grouped[t].map((route) => (
                          <Item
                            onPress={() => navigate(route.url)}
                            route={route}
                            activePage={activePage}
                          />
                        ))}
                        <Separator
                          borderStyle="dotted"
                          borderColor="gray"
                          marginVertical="$3"
                        />
                      </YStack>
                    );
                  default:
                    return (
                      <YStack>
                        <H5 color="gray">{t.toUpperCase()}</H5>
                        {grouped[t].map((route) => (
                          <Item
                            onPress={() => navigate(route.url)}
                            route={route}
                            activePage={activePage}
                          />
                        ))}
                        <Separator
                          borderStyle="dotted"
                          borderColor="gray"
                          marginVertical="$3"
                        />
                      </YStack>
                    );
                }
              })()}
            </YStack>
          ))}
          <Badge marginBottom="$1" color="purple" title="0.0.0" />
        </YStack>
      </View>
    </XStack>
  );
}
