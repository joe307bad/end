import {
  Section,
  Separator,
  SizableText,
  Tabs,
  ListItem,
  ScrollView,
  Label,
  RadioGroup,
  XStack,
  YStack,
  H3,
  Input,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { tw } from '../components';
import { PrimaryButton } from '../Display';
import { CircleDot, Crosshair, Hexagon } from '@tamagui/lucide-icons';
import React, {
  ElementType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useResponsive } from '../Layout';
import { derivedDefault, hexasphereProxy } from '@end/hexasphere';
import Select from '../Select/Select';
import { subscribeKey } from 'valtio/utils';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { View } from 'react-native';

type TurnAction = 'portal' | 'deploy' | 'attack' | 'reenforce' | null | string;

export function GameTabs({
  proxy,
  menuOpen,
  selectTile,
  newPlanet,
  startGame,
  attackDialog: AttackDialog,
}: {
  proxy: typeof hexasphereProxy;
  newPlanet: () => void;
  menuOpen: boolean;
  selectTile: (id: string, tileList?: { scrollTo(): void }) => void;
  startGame: () => void;
  attackDialog?: ElementType;
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

  const [turnAction, setTurnAction] = useState<TurnAction>('attack');

  const setSelectedTile = useCallback((tile: string) => {
    selectTile(tile);
  }, []);

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
            <TabsContent
              padding={0}
              value="tab1"
              style={{
                justifyContent: 'start',
              }}
            >
              <View style={{ width: '100%' }}>
                <RadioGroup
                  aria-labelledby="Select one item"
                  defaultValue="portal"
                  name="form"
                  onValueChange={setTurnAction}
                >
                  <XStack space="$0.5" paddingLeft="$1">
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'portal'} id={'1'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label
                        size={'$3'}
                        htmlFor={'1'}
                        paddingLeft="$0.5"
                        paddingRight="$0.5"
                      >
                        Portal
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'deploy'} id={'2'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label
                        size={'$3'}
                        htmlFor={'2'}
                        paddingLeft="$0.5"
                        paddingRight="$0.5"
                      >
                        Deploy
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'attack'} id={'3'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label
                        size={'$3'}
                        htmlFor={'3'}
                        paddingLeft="$0.5"
                        paddingRight="$0.5"
                      >
                        Attack
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'reenforce'} id={'4'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label
                        size={'$3'}
                        htmlFor={'4'}
                        paddingLeft="$0.5"
                        paddingRight="$0.5"
                      >
                        Reenforce
                      </Label>
                    </XStack>
                  </XStack>
                </RadioGroup>
              </View>
              <ScrollView
                style={{
                  display: 'flex',
                  width: '100%',
                  flex: 1,
                  padding: 5
                }}
              >
                {(() => {
                  switch (turnAction) {
                    case 'portal':
                      return (
                        <YStack
                          style={{ display: 'flex', width: '100%' }}
                          space="$1"
                        >
                          <H3>Change portal location</H3>
                          <XStack alignItems="center">
                            <Select
                              label="Portal entry #1"
                              items={proxy.tiles.map((t) => ({
                                key: t.name,
                                value: t.id,
                              }))}
                            />
                          </XStack>
                          <XStack alignItems="center">
                            <Select
                              label="Portal entry #2"
                              items={proxy.tiles.map((t) => ({
                                key: t.name,
                                value: t.id,
                              }))}
                            />
                          </XStack>
                        </YStack>
                      );
                    case 'deploy':
                      return (
                        <YStack
                          style={{ display: 'flex', width: '100%' }}
                          space="$1"
                        >
                          <H3>Deploy or remove troops for a territory</H3>
                          <XStack alignItems="center">
                            <Select
                              label="Territory"
                              items={proxy.tiles.map((t) => ({
                                key: t.name,
                                value: t.id,
                              }))}
                            />
                          </XStack>
                          <XStack alignItems="center">
                            <Label size={'$3'} htmlFor={'2'} paddingRight="$1">
                              Troop change +/-
                            </Label>
                            <Input padding="$0.5" />
                          </XStack>
                        </YStack>
                      );
                    case 'attack':
                      return (
                        <YStack height="100%">
                          <H3>Attack a territory</H3>
                          {AttackDialog && <AttackDialog />}
                        </YStack>
                      );
                    case 'reenforce':
                      return (
                        <YStack
                          style={{ display: 'flex', width: '100%' }}
                          space="$1"
                        >
                          <H3>Reenforce a territory</H3>
                          <XStack alignItems="center">
                            <Select
                              label="Territory"
                              onValueChange={setSelectedTile}
                              items={proxy.tiles.map((t) => ({
                                key: t.name,
                                value: t.id,
                              }))}
                            />
                          </XStack>
                          <XStack alignItems="center">
                            <Label size={'$3'} htmlFor={'2'} paddingRight="$1">
                              Troop change +/-
                            </Label>
                            <Input padding="$0.5" />
                          </XStack>
                        </YStack>
                      );
                    default:
                      return null;
                  }
                })()}
              </ScrollView>
            </TabsContent>
            <TabsContent value="tab2" style={tw`h-full`}>
              <View style={tw`h-full overflow-scroll w-full`}></View>
            </TabsContent>
          </Tabs>
        </View>
        <PrimaryButton onPress={newPlanet}>New Planet</PrimaryButton>
        <PrimaryButton onPress={onSync}>Sync</PrimaryButton>
      </View>
      <View>
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
      title={<View>{name}</View>}
      pressTheme
      onPress={() => selectTile(id)}
      iconAfter={selected ? Crosshair : null}
    />
  );
});