import {
  Section,
  Separator,
  SizableText,
  View,
  Tabs,
  ListItem,
  ScrollView,
  Label,
  RadioGroup,
  XStack,
  YStack, H3
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { tw } from '../components';
import { PrimaryButton } from '../Display';
import { CircleDot, Crosshair, Hexagon } from '@tamagui/lucide-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { useResponsive } from '../Layout';
import { derivedDefault, hexasphereProxy } from '@end/hexasphere';
import Select from '../Select/Select';
import { subscribeKey } from 'valtio/utils';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';

export function GameTabs({
  proxy,
  menuOpen,
  selectTile,
  newPlanet,
  startGame,
}: {
  proxy: typeof hexasphereProxy;
  newPlanet: () => void;
  menuOpen: boolean;
  selectTile: (id: string, tileList?: { scrollTo(): void }) => void;
  startGame: () => void;
}) {
  const { bp } = useResponsive(menuOpen, 1297);
  const sv = useRef<ScrollView | any>(null);

  useEffect(() => {
    const unsubscribe = subscribeKey(
      derivedDefault,
      'selectedTileIndex',
      (selectedTileIndex) => {
        if (sv.current) {
          sv.current.scrollTo(selectedTileIndex * 67);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const { services } = useEndApi();

  const onSync = useCallback(() => execute(services.syncService.sync()), []);

  return (
    <Section
      style={bp([
        'z-10 max-w-full',
        'relative w-full h-[50%]',
        '',
        'absolute w-[500px] pb-5 right-[20px] w-[500px] h-full',
      ])}
    >
      <View style={tw`flex h-full`}>
        <View style={tw`flex-1`}>
          <Tabs
            defaultValue="tab1"
            orientation="horizontal"
            flexDirection="column"
            borderRadius={5}
            borderWidth={1}
            maxHeight={'100%'}
            height="100%"
            overflow="hidden"
            borderColor="$borderColor"
            style={bp(['', `${menuOpen ? '' : 'hidden'}`, '', 'visible'])}
          >
            <Tabs.List
              separator={<Separator vertical />}
              disablePassBorderRadius="bottom"
            >
              <Tabs.Tab borderWidth={0} flex={1} value="tab1">
                <SizableText fontFamily="$body">Turn</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab2">
                <SizableText fontFamily="$body">Players</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab3">
                <SizableText fontFamily="$body">Score</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab4">
                <SizableText fontFamily="$body">Log</SizableText>
              </Tabs.Tab>
            </Tabs.List>
            <Separator />
            <TabsContent value="tab1">
              <View style={{ width: '100%' }}>
                <RadioGroup
                  aria-labelledby="Select one item"
                  defaultValue="3"
                  name="form"
                >
                  <XStack space="$0.5">
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'1'} id={'1'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label size={'$3'} htmlFor={'1'} padding="$1">
                        Portal
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'2'} id={'2'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label size={'$3'} htmlFor={'2'} padding="$1">
                        Deploy
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'2'} id={'2'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label size={'$3'} htmlFor={'2'} padding="$1">
                        Attack
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'3'} id={'3'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label size={'$3'} htmlFor={'3'} padding="$1">
                        Reenforce
                      </Label>
                    </XStack>
                  </XStack>
                </RadioGroup>
              </View>
              <YStack style={{display: 'flex', width: '100%'}} space="$1">
                <H3>Change portal location</H3>
                <XStack alignItems="center">
                  <Select
                    label="Portal entry #1"
                    items={proxy.tiles.map(t => t.name)}
                  />
                </XStack>
                <XStack alignItems="center">
                  <Select
                    label="Portal entry #2"
                    items={proxy.tiles.map(t => t.name)}
                  />
                </XStack>
              </YStack>
            </TabsContent>
            <TabsContent value="tab2" style={tw`h-full`}>
              <View style={tw`h-full overflow-scroll w-full`}></View>
            </TabsContent>
          </Tabs>
        </View>
        <PrimaryButton onPress={newPlanet}>New Planet</PrimaryButton>
        <PrimaryButton onPress={onSync}>Sync</PrimaryButton>
      </View>
      <View onPress={() => {}}>
        <CircleDot
          color="white"
          size="$2"
          style={bp(['block text-white self-end', '', '', 'hidden'])}
        />
      </View>
    </Section>
  );
}

const TileListItem = React.memo(function ({
  name,
  raised,
  selected,
  id,
  selectTile,
}: {
  id: string;
  selectTile: (id: string) => void;
  name: string;
  raised: boolean;
  selected: boolean;
}) {
  return (
    <ListItem
      display={raised ? 'flex' : 'none'}
      padding="$1"
      hoverTheme
      icon={Hexagon}
      title={<View style={{ cursor: 'pointer' }}>{name}</View>}
      pressTheme
      onPress={() => selectTile(id)}
      iconAfter={selected ? Crosshair : null}
    />
  );
});
