import {
  Section,
  Separator,
  SizableText,
  Tabs,
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
import { CircleDot } from '@tamagui/lucide-icons';
import React, {
  Dispatch,
  ElementType,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useResponsive } from '../Layout';
import { Coords, derivedDefault, hexasphereProxy } from '@end/hexasphere';
import Select, { SelectDemoItem } from '../Select/Select';
import { subscribeKey } from 'valtio/utils';
import { Pressable, View } from 'react-native';

type TurnAction = 'portal' | 'deploy' | 'attack' | 'reenforce' | null | string;

export function GameTabs({
  proxy,
  menuOpen,
  selectTile,
  setMenuOpen,
  attackDialog,
  portalCoords,
  setPortalCoords,
  setSelectingPortalEntry,
}: {
  proxy: typeof hexasphereProxy;
  newPlanet: () => void;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  selectTile: (id: string, tileList?: { scrollTo(): void }) => void;
  startGame: () => void;
  attackDialog?: ElementType;
  portalCoords?: [Coords?, Coords?];
  setPortalCoords?: Dispatch<SetStateAction<[Coords?, Coords?] | undefined>>;
  setSelectingPortalEntry?: Dispatch<
    SetStateAction<'first' | 'second' | undefined>
  >;
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

  const [turnAction, setTurnAction] = useState<TurnAction>('portal');

  const setSelectedTile = useCallback((tile: string) => {
    selectTile(tile);
  }, []);

  return (
    <Section
      style={bp([
        'z-10 max-w-full',
        `relative w-full ${menuOpen ? 'h-[50%]' : ''}`,
        '',
        'absolute w-[500px] pb-5 right-[20px] w-[500px] h-full',
      ])}
    >
      <View style={tw`flex h-full`}>
        <View
          style={bp(['flex-1', `${menuOpen ? '' : 'hidden'}`, '', 'visible'])}
        >
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
                  padding: 5,
                }}
              >
                <TurnActionComponent
                  setSelectingPortalEntry={setSelectingPortalEntry}
                  setSelectedTile={setSelectedTile}
                  attackDialog={attackDialog}
                  proxy={proxy}
                  turnAction={turnAction}
                  portalCoords={portalCoords}
                  setPortalCoords={setPortalCoords}
                />
              </ScrollView>
            </TabsContent>
            <TabsContent value="tab2" style={tw`h-full`}>
              <View style={tw`h-full overflow-scroll w-full`}></View>
            </TabsContent>
          </Tabs>
        </View>
        <Pressable
          onPress={() =>
            setMenuOpen((prev) => {
              return !prev;
            })
          }
          style={bp(['block text-white self-end', '', '', 'hidden'])}
        >
          <CircleDot color="white" size="$2" />
        </Pressable>
      </View>
    </Section>
  );
}

function TurnActionComponent({
  turnAction,
  proxy,
  attackDialog: AttackDialog,
  setSelectedTile,
  setSelectingPortalEntry,
  setPortalCoords,
  portalCoords,
}: {
  turnAction: TurnAction;
  proxy: typeof hexasphereProxy;
  attackDialog?: ElementType;
  setSelectedTile: (tile: string) => void;
  setSelectingPortalEntry?: Dispatch<
    SetStateAction<'first' | 'second' | undefined>
  >;
  portalCoords?: [Coords?, Coords?];
  setPortalCoords?: Dispatch<SetStateAction<[Coords?, Coords?] | undefined>>;
}) {
  switch (turnAction) {
    case 'portal':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <H3>Change portal location</H3>
          <RadioGroup
            defaultValue="first"
            onValueChange={(value: 'first' | 'second' | any) => {
              setSelectingPortalEntry?.(value);
            }}
          >
            <XStack alignItems="center">
              <XStack minWidth="$1" paddingHorizontal="$0.75">
                <Label htmlFor="first">Portal entry #1</Label>
              </XStack>
              <XStack flex={1} alignItems="center" justifyContent="flex-end">
                <SelectDemoItem
                  value={Object.values(portalCoords?.[0] ?? {}).join(',')}
                  onValueChange={(value) => {
                    setPortalCoords?.((prev) => {
                      const [x, y, z] = value.split(',');
                      prev = [
                        {
                          x: parseFloat(x),
                          y: parseFloat(y),
                          z: parseFloat(z),
                        },
                        prev?.[1],
                      ];
                      return prev;
                    });
                  }}
                  id="first-select"
                  items={proxy.tiles.map((t) => ({
                    key: t.name,
                    value: t.id,
                  }))}
                  native
                />
              </XStack>
              <XStack paddingHorizontal="$0.75">
                <RadioGroup.Item value={'first'} id={'first'} size={'$3'}>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
              </XStack>
            </XStack>
            <XStack alignItems="center">
              <XStack minWidth="$1" paddingHorizontal="$0.75">
                <Label htmlFor="second">Portal entry #2</Label>
              </XStack>
              <XStack flex={1} alignItems="center" justifyContent="flex-end">
                <SelectDemoItem
                  id="second-select"
                  value={Object.values(portalCoords?.[1] ?? {}).join(',')}
                  onValueChange={(value) => {
                    setPortalCoords?.((prev) => {
                      const [x, y, z] = value.split(',');
                      prev = [
                        prev?.[0],
                        {
                          x: parseFloat(x),
                          y: parseFloat(y),
                          z: parseFloat(z),
                        },
                      ];
                      return prev;
                    });
                  }}
                  items={proxy.tiles.map((t) => ({
                    key: t.name,
                    value: t.id,
                  }))}
                  native
                />
              </XStack>
              <XStack paddingHorizontal="$0.75">
                <RadioGroup.Item value={'second'} id={'second'} size={'$3'}>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
              </XStack>
            </XStack>
          </RadioGroup>
          {/*<XStack alignItems="center">*/}
          {/*  <Select*/}
          {/*    label="Portal entry #1"*/}
          {/*  />*/}
          {/*</XStack>*/}
          {/*<XStack alignItems="center">*/}
          {/*  <Select*/}
          {/*    label="Portal entry #2"*/}

          {/*  />*/}
          {/*</XStack>*/}
        </YStack>
      );
    case 'deploy':
      return (
        <YStack style={{ display: 'flex', width: '100%' }} space="$1">
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
        <YStack style={{ display: 'flex', width: '100%' }} space="$1">
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
}
