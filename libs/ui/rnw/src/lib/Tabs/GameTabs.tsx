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
import { Coords } from '@end/hexasphere';
import { SelectDemoItem } from '../Select';
import { subscribeKey } from 'valtio/utils';
import { Pressable, View } from 'react-native';
import { warProxy, warDerived } from '@end/data/core';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { TurnAction } from '@end/war/core';
import { ActivityArrow } from '../ActivityArrow';
import { Swords } from '@tamagui/lucide-icons';

export function GameTabs({
  proxy,
  derived,
  menuOpen,
  selectTile,
  setMenuOpen,
  attackDialog,
  portalCoords,
  setPortalCoords,
  setSelectingPortalEntry,
  selectedTile,
  deployCoords,
  setDeployCoords,
  turnAction,
  setTurnAction,
  availableTroops,
  setAvailableTroops,
  troopChange,
  setTroopChange,
  attackTerritories,
  attackTerritory,
  setTerritoryToAttack,
                           territoryToAttack
}: {
  derived: typeof warDerived;
  proxy: typeof warProxy;
  newPlanet: () => void;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  selectTile: (id: string, tileList?: { scrollTo(): void }) => void;
  startGame: () => void;
  attackDialog?: ElementType;
  portalCoords?: [Coords?, Coords?];
  setPortalCoords?: Dispatch<SetStateAction<[Coords?, Coords?] | undefined>>;
  deployCoords?: Coords;
  setDeployCoords?: Dispatch<SetStateAction<Coords | undefined>>;
  setSelectingPortalEntry?: Dispatch<
    SetStateAction<'first' | 'second' | undefined>
  >;
  selectedTile?: string;
  turnAction?: TurnAction;
  setTurnAction?: Dispatch<SetStateAction<TurnAction>>;
  availableTroops: number;
  setAvailableTroops?: Dispatch<SetStateAction<number>>;
  troopChange: number;
  setTroopChange?: Dispatch<SetStateAction<number>>;
  attackTerritories: string[];
  attackTerritory: () => void;
  setTerritoryToAttack?: Dispatch<SetStateAction<string | undefined>>;
  territoryToAttack?: string;
}) {
  const { bp } = useResponsive(menuOpen, 1297);
  const sv = useRef<ScrollView | any>(null);
  const disableListMovement = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeKey(
      derived,
      'selectedTileIndex',
      (selectedTileIndex) => {
        if (
          sv.current &&
          selectedTileIndex > -1 &&
          !disableListMovement.current
        ) {
          sv.current.scrollTo(selectedTileIndex * 44);
        }

        if (disableListMovement.current) {
          disableListMovement.current = false;
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const setSelectedTile = useCallback(
    (tile: string) => {
      disableListMovement.current = true;
      selectTile(tile);
    },
    [selectTile]
  );

  const [sort, setSort] = useState<
    'most-troops' | 'least-troops' | 'alphabetical' | string
  >('alphabetical');

  const [filter, setFilter] = useState<
    'all' | 'mine' | 'opponents' | 'bordering' | string
  >('all');

  useEffect(() => {
    proxy.sort = sort;
    proxy.filter = filter;
  }, [sort, filter]);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const advanceTurn = useCallback(() => {
    if (!setTurnAction) {
      return;
    }

    switch (turnAction) {
      case 'portal':
        setTurnAction('deploy');
        break;
      case 'deploy':
        setTurnAction('attack');
        break;
      case 'attack':
        setTurnAction('portal');
        break;
      // case 'reenforce':
      //   setTurnAction('portal');
        break;
    }
  }, [turnAction]);

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
                  onValueChange={setTurnAction}
                  value={turnAction}
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
                        onPress={advanceTurn}
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
                  `${turnAction === 'attack' ? 'max-h-[40%]' : ''}`,
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
                    setSelectingPortalEntry={setSelectingPortalEntry}
                    setSelectedTile={setSelectedTile}
                    attackDialog={attackDialog}
                    proxy={proxy}
                    turnAction={turnAction}
                    portalCoords={portalCoords}
                    setPortalCoords={setPortalCoords}
                    deployCoords={deployCoords}
                    setDeployCoords={setDeployCoords}
                    availableTroops={availableTroops}
                    setAvailableTroops={setAvailableTroops}
                    troopChange={troopChange}
                    setTroopChange={setTroopChange}
                    attackTerritories={attackTerritories}
                    attackTerritory={attackTerritory}
                    setTerritoryToAttack={setTerritoryToAttack}
                    territoryToAttack={territoryToAttack}
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
                        onValueChange={setFilter}
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
                        onValueChange={setSort}
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
                  <TilesList
                    proxy={proxy}
                    selectedTile={selectedTile}
                    selectTile={setSelectedTile}
                    sort={sort}
                    filter={filter}
                  />
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
  selectedTile,
  selectTile,
  sort,
  filter,
}: {
  proxy: typeof warProxy;
  selectedTile?: string;
  selectTile: (id: string) => void;
  sort: 'most-troops' | 'least-troops' | 'alphabetical' | string;
  filter: 'all' | 'mine' | 'opponents' | 'bordering' | string;
}) {
  const { services } = useEndApi();
  const tiles = useMemo(() => {
    return services.hexaService.sortedTilesList(sort, filter);
  }, [sort, filter]);

  return (
    <>
      {tiles.map((t: any) => (
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
            selectTile(t.id);
          }}
          iconAfter={t.id === selectedTile ? Crosshair : null}
        />
      ))}
    </>
  );
}

function TurnActionComponent({
  turnAction,
  proxy,
  attackDialog: AttackDialog,
  setSelectingPortalEntry,
  setPortalCoords,
  portalCoords,
  setDeployCoords,
  deployCoords,
  availableTroops,
  setAvailableTroops,
  troopChange,
  setTroopChange,
  attackTerritories,
  attackTerritory,
  setTerritoryToAttack,
                               territoryToAttack
}: {
  turnAction: TurnAction;
  proxy: typeof warProxy;
  attackDialog?: ElementType;
  setSelectedTile: (tile: string) => void;
  setSelectingPortalEntry?: Dispatch<
    SetStateAction<'first' | 'second' | undefined>
  >;
  portalCoords?: [Coords?, Coords?];
  setPortalCoords?: Dispatch<SetStateAction<[Coords?, Coords?] | undefined>>;
  deployCoords?: Coords;
  setDeployCoords?: Dispatch<SetStateAction<Coords | undefined>>;
  availableTroops: number;
  setAvailableTroops?: Dispatch<SetStateAction<number>>;
  troopChange: number;
  setTroopChange?: Dispatch<SetStateAction<number>>;
  attackTerritories: string[];
  attackTerritory: () => void;
  setTerritoryToAttack?: Dispatch<SetStateAction<string | undefined>>;
  territoryToAttack?: string;
}) {
  const tiles = useSnapshot(warDerived.raisedTiles);

  switch (turnAction) {
    case 'portal':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <H4>Change portal location</H4>
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
                  items={tiles.map((t) => ({
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
                  items={tiles.map((t) => ({
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
                value={Object.values(deployCoords ?? {}).join(',')}
                onValueChange={(value) => {
                  const [x, y, z] = value.split(',');
                  setDeployCoords?.({
                    x: parseFloat(x),
                    y: parseFloat(y),
                    z: parseFloat(z),
                  });
                }}
                items={tiles.map((t) => ({
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
                    setTroopChange?.(v);
                  }}
                  value={(troopChange ?? 0).toString()}
                  padding="$0.5"
                />
              </V>
              <V>
                <Text>{availableTroops}</Text>
              </V>
              <V>
                <ActivityArrow
                  loading={false}
                  onPress={() => {
                    setAvailableTroops?.((prev) => {
                      return prev - troopChange;
                    });
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
              <Pressable onPress={attackTerritory}>
                <Swords size="$1" />
              </Pressable>
            </V>
          </XStack>
          {AttackDialog && (
            <AttackDialog
              territoryToAttack={territoryToAttack}
              portalCoords={portalCoords}
              owner={1}
              setTerritoryToAttack={setTerritoryToAttack}
            />
          )}
        </YStack>
      );
    case 'reenforce':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <H4>Reenforce a territory</H4>
          <XStack alignItems="center">
            <XStack minWidth="25%" paddingHorizontal="$0.75">
              <Label htmlFor="reenforce-select">Territory</Label>
            </XStack>
            <XStack flex={1} alignItems="center" justifyContent="flex-end">
              <SelectDemoItem
                id="deploy-select"
                items={proxy.tiles.map((t) => ({
                  key: t.name,
                  value: t.id,
                }))}
                native
              />
            </XStack>
          </XStack>
          <XStack alignItems="center">
            <XStack minWidth="$1" paddingHorizontal="$0.75">
              <Label htmlFor="reenforce-change">Troop change</Label>
            </XStack>
            <XStack flex={1} alignItems="center" justifyContent="flex-end">
              <Input padding="$0.5" />
            </XStack>
          </XStack>
        </YStack>
      );
    default:
      return null;
  }
}
