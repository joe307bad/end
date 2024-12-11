import {
  Separator,
  SizableText,
  Tabs,
  ScrollView,
  Label,
  RadioGroup,
  XStack,
  YStack,
  Input,
  ListItem,
  Text,
  View as V,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { Crosshair, Dot, Hexagon } from '@tamagui/lucide-icons';
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
import { View } from 'react-native';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { getOrUndefined } from 'effect/Option';
import { Effect, Option as O, pipe } from 'effect';
import { useParams } from 'react-router-dom';
import { execute } from '@end/data/core';
import { ResponsiveTabs } from './ResponsiveTabs';
import { LobbyTabs } from './LobbyTabs';
import { Tile, TurnAction } from '@end/war/core';
import { Badge, PrimaryButton } from '../Display';

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
          sv.current.scrollTo(selectedTileIndex * 44);
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

  return (
    <ResponsiveTabs menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
      {warStore.players.length < 2 ? (
        <LobbyTabs />
      ) : (
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
            {warStore.currentUsersTurn === warStore.userId ? (
              <>
                <V
                  display="flex"
                  style={bp(['', 'flex-column', 'flex-row-reverse'])}
                  width="100%"
                >
                  <V
                    style={bp(['', 'w-full justify-center', 'flex-1'])}
                    space="$0.5"
                    justifyContent="flex-end"
                    alignItems="center"
                    flexDirection="row"
                  >
                    <Badge title="joebad" />
                    <Badge color="green" title="3/50" />
                    <Badge color="red" title="1,569" />
                  </V>
                  <View style={bp(['', 'w-full items-center', 'flex'])}>
                    <RadioGroup
                      aria-labelledby="Select one item"
                      name="form"
                      // @ts-ignore
                      onValueChange={warService.setTurnAction}
                      value={warStore.turnAction}
                    >
                      <XStack space="$1">
                        <XStack alignItems="center">
                          <RadioGroup.Item
                            value={'portal'}
                            id={'1'}
                            size={'$3'}
                          >
                            <RadioGroup.Indicator />
                          </RadioGroup.Item>
                          <Label paddingLeft="$0.5" size={'$3'} htmlFor={'1'}>
                            Portal
                          </Label>
                        </XStack>
                        <XStack alignItems="center">
                          <RadioGroup.Item
                            value={'deploy'}
                            id={'2'}
                            size={'$3'}
                          >
                            <RadioGroup.Indicator />
                          </RadioGroup.Item>

                          <Label paddingLeft="$0.5" size={'$3'} htmlFor={'2'}>
                            Deploy
                          </Label>
                        </XStack>
                        <XStack alignItems="center">
                          <RadioGroup.Item
                            value={'attack'}
                            id={'3'}
                            size={'$3'}
                          >
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
                          {/*<ActivityArrow*/}
                          {/*  loading={loading}*/}
                          {/*  onPress={() => warService.setTurnAction()}*/}
                          {/*  open={open}*/}
                          {/*  message={errorMessage}*/}
                          {/*/>*/}
                        </V>
                      </XStack>
                    </RadioGroup>
                  </View>
                </V>
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
                      // padding: 5,
                    }}
                  >
                    <TurnActionComponent attackDialog={attackDialog} />
                  </ScrollView>
                </View>
                <View
                  style={{
                    flex: 1,
                    width: '100%',
                  }}
                >
                  <YStack>
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
                          value={warStore.filter}
                          onValueChange={warService.setFilter}
                          items={[
                            { value: 'all', key: 'All territories' },
                            { value: 'mine', key: 'My territories' },
                            {
                              value: 'opponents',
                              key: 'Opponents territories',
                            },
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
              </>
            ) : (
              <View style={{ width: '100%', display: 'flex' }}>
                <V flex={1} alignItems="flex-end">
                  <Badge title="joebad" />
                  <Badge color="green" title="3/50" />
                </V>
              </View>
            )}
          </TabsContent>
        </Tabs>
      )}
    </ResponsiveTabs>
  );
}

function AttackActions({ tile }: { tile: Partial<Tile> }) {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  const colors = useMemo(() => {
    return warStore.players.reduce((acc: Record<string, string>, curr) => {
      acc[curr.id] = curr.color;
      return acc;
    }, {});
  }, [warStore.players]);
  const engage = useCallback(async () => {
    await execute(conquestService.engage());
  }, []);
  return (
    <V padding="$0.75">
      {Object.values(warDerived.selectedNeighborsOwners).map((tile) => (
        <ListItem
          key={`neighbor-${tile.id}`}
          display={tile.raised ? 'flex' : 'none'}
          padding="0"
          paddingLeft="$1"
          paddingRight="$1"
          hoverTheme
          icon={() => (
            <V flexDirection="row">
              <Hexagon color={colors[tile.owner]} />
              {warDerived.battlesByTile[tile.id] ? (
                warDerived.battlesByTile[tile.id].map(() => (
                  <V
                    display="flex"
                    alignItems="center"
                    width={10}
                    overflow="hidden"
                  >
                    <Dot color="yellow" />
                  </V>
                ))
              ) : (
                <></>
              )}
            </V>
          )}
          title={
            <View
              style={{
                /* @ts-ignore */
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <Text flex={1}>{tile.name}</Text>
              <Text>{tile.troopCount}</Text>
            </View>
          }
          pressTheme
          onPress={() => {
            const [_, coords] = warService.tileIdAndCoords(tile.id);
            warService.setTerritoryToAttack(coords);
          }}
          iconAfter={
            tile.id ===
            warService.tileIdAndCoords(
              getOrUndefined(warStore.territoryToAttack)
            )[0] ? (
              <PrimaryButton
                // disabled={!enabled}
                onPress={engage}
                height="$2"
                withIcon={true}
              >
                <V
                  flexDirection="row"
                  space="$0.5"
                  alignItems="center"
                  padding="$1"
                >
                  {/*{enabled ? (*/}
                  {/*  <CheckCheck size={'$1'} color={'green'} />*/}
                  {/*) : (*/}
                  {/*  <XCircle size={'$1'} color={'red'} />*/}
                  {/*)}*/}
                  <Text>Engage</Text>
                </V>
              </PrimaryButton>
            ) : (
              <></>
            )
          }
        />
      ))}
    </V>
  );
}

function TileActions({ tile }: { tile: Partial<Tile> }) {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warDerived = useSnapshot(warService.derived);
  const warStore = useSnapshot(warService.store);

  const deploy = useCallback(async () => {
    await execute(conquestService.deploy());
  }, []);

  switch (warStore.turnAction) {
    case 'attack':
      return Object.values(warDerived.selectedNeighborsOwners).length > 0 &&
        tile.owner === warStore.userId ? (
        <AttackActions tile={tile} />
      ) : (
        <></>
      );
    case 'deploy':
      return (
        <V padding="$0.75">
          <ListItem
            padding="0"
            paddingLeft="$1"
            paddingRight="$1"
            iconAfter={
              <V flexDirection="row">
                <V width="100px" marginRight="$0.5">
                  <Input
                    placeholder="123"
                    onChange={(e) =>
                      warService.setTroopsToDeploy(Number(e.nativeEvent.text))
                    }
                    padding="$0.25"
                    width="100%"
                    height="$2"
                  />
                </V>
                <V width="100px">
                  <PrimaryButton onPress={deploy} withIcon height="$2">
                    Deploy
                  </PrimaryButton>
                </V>
              </V>
            }
          >
            <Text>Available: {warStore.availableTroopsToDeploy}</Text>
          </ListItem>
        </V>
      );
    default:
      return <></>;
  }
}

function TilesList({
  setSelectedTile,
}: {
  setSelectedTile: (id: string) => void;
}) {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  const [selectedTileId] = warService.tileIdAndCoords(
    getOrUndefined(warStore.selectedTileId)
  );

  const colors = useMemo(() => {
    return warStore.players.reduce((acc: Record<string, string>, curr) => {
      acc[curr.id] = curr.color;
      return acc;
    }, {});
  }, [warStore.players]);

  const engage = useCallback(async () => {
    await execute(conquestService.engage());
  }, []);

  return (
    <>
      {warDerived.sortedTiles.map((t) => {
        return (
          <>
            <ListItem
              key={t.id}
              display={t.raised ? 'flex' : 'none'}
              padding="0"
              paddingLeft="$1"
              paddingRight="$1"
              hoverTheme
              icon={() => (
                <V flexDirection="row">
                  <Hexagon color={colors[t.owner]} />
                  {warDerived.battlesByTile[t.id] ? (
                    warDerived.battlesByTile[t.id].map(() => (
                      <V
                        display="flex"
                        alignItems="center"
                        width={10}
                        overflow="hidden"
                      >
                        <Dot color="yellow" />
                      </V>
                    ))
                  ) : (
                    <></>
                  )}
                </V>
              )}
              title={
                <View
                  style={{
                    /* @ts-ignore */
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <Text flex={1}>{t.name}</Text>
                  <Text>{t.troopCount}</Text>
                </View>
              }
              pressTheme
              onPress={() => {
                setSelectedTile(t.id);
              }}
              iconAfter={t.id === selectedTileId ? Crosshair : null}
            />
            {t.id === selectedTileId ? <TileActions tile={t} /> : <></>}
          </>
        );
      })}
    </>
  );
}

function TurnActionComponent({
  attackDialog: AttackDialog,
}: {
  attackDialog?: ElementType;
}) {
  const { services } = useEndApi();
  const { warService, conquestService, authService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  let params = useParams();

  // if (warStore.currentUsersTurn !== warStore.userId) {
  //   return (
  //     <View>
  //       <H4>Current Turn: {warStore.currentUsersTurn}</H4>
  //       <H4>Current Round: {warStore.round}</H4>
  //     </View>
  //   );
  // }

  const [userId, setUserId] = useState<string>();
  useEffect(() => {
    execute(authService.getUserId()).then((v) => setUserId(v));
  }, []);

  const turnAction: TurnAction = warStore.turnAction;

  switch (turnAction) {
    case 'portal':
      return (
        <YStack style={{ display: 'flex', width: '100%' }}>
          <RadioGroup
            defaultValue="first"
            value={warStore.settingPortalCoords}
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
                    warService
                      .setPortal(value)
                      .then(() => execute(conquestService.setPortal()));
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
                    warService
                      .setPortal(value)
                      .then(() => execute(conquestService.setPortal()));
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
      // return (
      //   <YStack style={{ display: 'flex', width: '100%' }}>
      //     <XStack alignItems="center">
      //       <XStack minWidth="25%" paddingHorizontal="$0.75">
      //         <Label htmlFor="deploy-select">Territory</Label>
      //       </XStack>
      //       <XStack flex={1} alignItems="center" justifyContent="flex-end">
      //         <SelectDemoItem
      //           id="deploy-select"
      //           value={Object.values(
      //             getOrUndefined(warStore.deployTo) ?? {}
      //           ).join(',')}
      //           onValueChange={warService.setDeployTo}
      //           items={warDerived.raisedTiles.map((t) => ({
      //             key: t.name,
      //             value: t.id,
      //           }))}
      //           native
      //         />
      //       </XStack>
      //     </XStack>
      //     <XStack alignItems="center">
      //       <XStack minWidth="$1" paddingHorizontal="$0.75">
      //         <Label htmlFor="deploy-change">Troop change</Label>
      //       </XStack>
      //       <XStack
      //         flex={1}
      //         alignItems="center"
      //         space="$0.75"
      //         justifyContent="flex-end"
      //       >
      //         <V flex={1}>
      //           <Input
      //             onChange={(e) => {
      //               const v = !e.nativeEvent.text
      //                 ? 0
      //                 : parseInt(e.nativeEvent.text);
      //               warService.setTroopsToDeploy?.(v);
      //             }}
      //             value={(warStore.troopsToDeploy ?? 0).toString()}
      //             padding="$0.5"
      //           />
      //         </V>
      //         <V>
      //           <Text>{warStore.availableTroopsToDeploy}</Text>
      //         </V>
      //         <V>
      //           <ActivityArrow
      //             loading={false}
      //             // @ts-ignore
      //             onPress={() => {
      //               deploy();
      //               // warService.setAvailableTroopsToDeploy();
      //               // warService.deployToTerritory();
      //             }}
      //             open={false}
      //             message={''}
      //           />
      //         </V>
      //       </XStack>
      //     </XStack>
      //   </YStack>
      // );
      return <></>;
    case 'attack':
      return (
        <YStack height="50%">
          {AttackDialog && warDerived.isOwner && (
            <>
              {/*<BattleSelection />*/}
              {/*{!getOrUndefined(warStore.activeBattle) ? (*/}
              {/*  <AttackDialog*/}
              {/*    territoryToAttack={warStore.territoryToAttack}*/}
              {/*    portalCoords={warStore.portal}*/}
              {/*    setTerritoryToAttack={warService.setTerritoryToAttack}*/}
              {/*  />*/}
              {/*) : (*/}
              {/*  <ActiveBattle battleId={getOrUndefined(warStore.activeBattle)} />*/}
              {/*)}*/}
            </>
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
