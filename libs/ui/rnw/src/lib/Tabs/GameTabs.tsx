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
  Input,
  H4,
  ListItem,
  Text,
  View as V,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { tw } from '../components';
import {
  CircleDot,
  Crosshair,
  Hexagon,
  ArrowRight,
} from '@tamagui/lucide-icons';
import React, {
  Dispatch,
  ElementType,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useResponsive } from '../Layout';
import { SelectDemoItem } from '../Select';
import { subscribeKey } from 'valtio/utils';
import { Pressable, View } from 'react-native';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { ActivityArrow } from '../ActivityArrow';
import { Swords } from '@tamagui/lucide-icons';
import { getOrUndefined } from 'effect/Option';

export function GameTabsV2({
  menuOpen,
  setMenuOpen,
  attackDialog,
}: {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  attackDialog?: ElementType;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const { bp } = useResponsive(menuOpen, 1297);
  const sv = useRef<ScrollView | any>(null);
  const disableListMovement = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeKey(
      warService.derived,
      'selectedTileIndex',
      (selectedTileIndex) => {
        if (!selectedTileIndex) {
          return;
        }

        if (
          sv.current &&
          selectedTileIndex > -1 &&
          !disableListMovement.current
        ) {
          sv.current.scrollTo(selectedTileIndex);
        }

        if (disableListMovement.current) {
          disableListMovement.current = false;
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const setSelectedTile = useCallback((tile: string) => {
    disableListMovement.current = true;
    warService.setSelectedTileIdOverride(tile);
  }, []);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [loading]);

  return (
    <Section
      style={bp([
        'z-10 max-w-full',
        `relative w-full ${menuOpen ? 'h-[75%]' : ''}`,
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
                height: '100%',
                display: 'flex',
              }}
            >
              <View style={{ width: '100%' }}>
                <RadioGroup
                  aria-labelledby="Select one item"
                  name="form"
                  // @ts-ignore
                  onValueChange={warService.setTurnAction}
                  value={warStore.turnAction}
                >
                  <XStack paddingLeft="$0.75" space="$1">
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'portal'} id={'1'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label paddingLeft="$0.5" size={'$3'} htmlFor={'1'}>
                        Portal
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'deploy'} id={'2'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label paddingLeft="$0.5" size={'$3'} htmlFor={'2'}>
                        Deploy
                      </Label>
                    </XStack>
                    <XStack alignItems="center">
                      <RadioGroup.Item value={'attack'} id={'3'} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>

                      <Label paddingLeft="$0.5" size={'$3'} htmlFor={'3'}>
                        Attack
                      </Label>
                    </XStack>
                    {/*<XStack alignItems="center">*/}
                    {/*  <RadioGroup.Item value={'reenforce'} id={'4'} size={'$3'}>*/}
                    {/*    <RadioGroup.Indicator />*/}
                    {/*  </RadioGroup.Item>*/}

                    {/*  <Label paddingLeft="$0.5" size={'$3'} htmlFor={'4'}>*/}
                    {/*    Reenforce*/}
                    {/*  </Label>*/}
                    {/*</XStack>*/}
                    <V paddingRight="$0.5" flex={1}>
                      <ActivityArrow
                        loading={loading}
                        onPress={() => warService.setTurnAction()}
                        open={open}
                        message={errorMessage}
                      />
                    </V>
                  </XStack>
                </RadioGroup>
              </View>
              <View
                style={bp([
                  'w-full',
                  `${warStore.turnAction === 'attack' ? 'max-h-[40%]' : ''}`,
                ])}
              >
                <ScrollView
                  style={{
                    display: 'flex',
                    width: '100%',
                    padding: 5,
                  }}
                >
                  <TurnActionComponent
                    setSelectedTile={setSelectedTile}
                    attackDialog={attackDialog}
                  />
                </ScrollView>
              </View>
              <View
                style={{
                  flex: 1,
                  width: '100%',
                }}
              >
                <YStack>
                  <View>
                    <H4 paddingLeft="$0.75">Territories</H4>
                  </View>
                  <XStack>
                    <XStack
                      flex={1}
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <XStack minWidth="$1" paddingHorizontal="$0.75">
                        <Label htmlFor="first">Filter</Label>
                      </XStack>
                      <SelectDemoItem
                        id="sort-1"
                        onValueChange={warService.setFilter}
                        items={[
                          { value: 'all', key: 'All territories' },
                          { value: 'mine', key: 'My territories' },
                          { value: 'opponents', key: 'Opponents territories' },
                        ]}
                        native
                      />
                    </XStack>
                    <XStack
                      flex={1}
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <XStack minWidth="$1" paddingHorizontal="$0.75">
                        <Label htmlFor="first">Sort</Label>
                      </XStack>
                      <SelectDemoItem
                        onValueChange={warService.setSort}
                        id="sort-2"
                        items={[
                          { value: 'alphabetical', key: 'Alphabetical' },
                          { value: 'most-troops', key: 'Most troops' },
                          { value: 'least-troops', key: 'Least troops' },
                        ]}
                        native
                      />
                    </XStack>
                  </XStack>
                </YStack>
                <ScrollView ref={sv}>
                  <TilesList setSelectedTile={setSelectedTile} />
                </ScrollView>
              </View>
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

function TilesList({
  setSelectedTile,
}: {
  setSelectedTile: (id: string) => void;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  const [selectedTileId] = warService.tileIdAndCoords(
    getOrUndefined(warStore.selectedTileId)
  );

  return (
    <>
      {warDerived.sortedTiles.map((t) => (
        <ListItem
          display={t.raised ? 'flex' : 'none'}
          padding="0"
          paddingLeft="$1"
          paddingRight="$1"
          hoverTheme
          icon={Hexagon}
          title={
            <View
              style={{
                /* @ts-ignore */
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <View style={{ flex: 1 }}>{t.name}</View>
              <View>{t.troopCount}</View>
            </View>
          }
          pressTheme
          onPress={() => {
            setSelectedTile(t.id);
          }}
          iconAfter={t.id === selectedTileId ? Crosshair : null}
        />
      ))}
    </>
  );
}

function TurnActionComponent({
  attackDialog: AttackDialog,
  setSelectedTile,
}: {
  attackDialog?: ElementType;
  setSelectedTile: (tile: string) => void;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);

  switch (warStore.turnAction) {
    case 'portal':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <H4>Change portal location</H4>
          <RadioGroup
            defaultValue="first"
            // @ts-ignore
            onValueChange={warService.setSettingPortalCoords}
          >
            <XStack alignItems="center">
              <XStack minWidth="$1" paddingHorizontal="$0.75">
                <Label htmlFor="first">Portal entry #1</Label>
              </XStack>
              <XStack flex={1} alignItems="center" justifyContent="flex-end">
                <SelectDemoItem
                  value={Object.values(warStore.portal?.[0] ?? {}).join(',')}
                  onValueChange={(value) => {
                    warService.setSettingPortalCoords('first');
                    warService.setPortal(value);
                  }}
                  id="first-select"
                  items={warDerived.raisedTiles.map((t) => ({
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
                  value={Object.values(warStore.portal?.[1] ?? {}).join(',')}
                  onValueChange={(value) => {
                    warService.setSettingPortalCoords('second');
                    warService.setPortal(value);
                  }}
                  items={warDerived.raisedTiles.map((t) => ({
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
        </YStack>
      );
    case 'deploy':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <H4>Deploy or remove troops for a territory</H4>
          <XStack alignItems="center">
            <XStack minWidth="25%" paddingHorizontal="$0.75">
              <Label htmlFor="deploy-select">Territory</Label>
            </XStack>
            <XStack flex={1} alignItems="center" justifyContent="flex-end">
              <SelectDemoItem
                id="deploy-select"
                value={Object.values(
                  getOrUndefined(warStore.deployTo) ?? {}
                ).join(',')}
                onValueChange={warService.setDeployTo}
                items={warDerived.raisedTiles.map((t) => ({
                  key: t.name,
                  value: t.id,
                }))}
                native
              />
            </XStack>
          </XStack>
          <XStack alignItems="center">
            <XStack minWidth="$1" paddingHorizontal="$0.75">
              <Label htmlFor="deploy-change">Troop change</Label>
            </XStack>
            <XStack
              flex={1}
              alignItems="center"
              space="$0.75"
              justifyContent="flex-end"
            >
              <V flex={1}>
                <Input
                  onChange={(e) => {
                    const v = !e.nativeEvent.text
                      ? 0
                      : parseInt(e.nativeEvent.text);
                    warService.setTroopsToDeploy?.(v);
                  }}
                  value={(warStore.troopsToDeploy ?? 0).toString()}
                  padding="$0.5"
                />
              </V>
              <V>
                <Text>{warStore.availableTroopsToDeploy}</Text>
              </V>
              <V>
                <ActivityArrow
                  loading={false}
                  // @ts-ignore
                  onPress={() => {
                    warService.setAvailableTroopsToDeploy();
                    warService.deployToTerritory();
                  }}
                  open={false}
                  message={''}
                />
              </V>
            </XStack>
          </XStack>
        </YStack>
      );
    case 'attack':
      return (
        <YStack id="where-is-this" height="50%">
          <XStack>
            <V flex={1}>
              <H4>Attack a territory</H4>
            </V>
            <V justifyContent="center">
              <Pressable onPress={warService.attackTerritory}>
                <Swords size="$1" />
              </Pressable>
            </V>
          </XStack>
          {AttackDialog && (
            <AttackDialog
              territoryToAttack={warStore.territoryToAttack}
              portalCoords={warStore.portal}
              owner={1}
              setTerritoryToAttack={warService.setTerritoryToAttack}
            />
          )}
        </YStack>
      );
    // case 'reenforce':
    //   return (
    //     <YStack style={{ display: 'flex', width: '100%' }}>
    //       <H4>Reenforce a territory</H4>
    //       <XStack alignItems="center">
    //         <XStack minWidth="25%" paddingHorizontal="$0.75">
    //           <Label htmlFor="reenforce-select">Territory</Label>
    //         </XStack>
    //         <XStack flex={1} alignItems="center" justifyContent="flex-end">
    //           <SelectDemoItem
    //             id="deploy-select"
    //             items={warStore.tiles.map((t) => ({
    //               key: t.name,
    //               value: t.id,
    //             }))}
    //             native
    //           />
    //         </XStack>
    //       </XStack>
    //       <XStack alignItems="center">
    //         <XStack minWidth="$1" paddingHorizontal="$0.75">
    //           <Label htmlFor="reenforce-change">Troop change</Label>
    //         </XStack>
    //         <XStack flex={1} alignItems="center" justifyContent="flex-end">
    //           <Input padding="$0.5" />
    //         </XStack>
    //       </XStack>
    //     </YStack>
    //   );
    default:
      return null;
  }
}
