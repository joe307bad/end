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
  H5,
  XStackProps,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { Dot, Hexagon, UserCircle2 } from 'lucide-react-native';
import React, {
  Dispatch,
  ElementType,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useResponsive } from '../Layout';
import { SelectDemoItem } from '../Select';
import { subscribeKey } from 'valtio/utils';
import { View } from 'react-native';
import { useEndApi } from '@end/data/web';
import { useSnapshot } from 'valtio';
import { getOrUndefined } from 'effect/Option';
import { execute } from '@end/data/core';
import { ResponsiveTabs } from './ResponsiveTabs';
import { LobbyTabs } from './LobbyTabs';
import { Tile } from '@end/war/core';
import { Badge, PrimaryButton } from '@end/ui/shared';
import { Checkbox } from '../Checkbox';

function TileInfo({
  name,
  owner,
  ...rest
}: { name: string; owner?: string } & XStackProps) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);

  const color = warStore.players.find((p) => p.id === owner)?.color;

  return (
    <XStack {...rest}>
      <V paddingRight="$0.5">
        <Hexagon color={color} />
      </V>
      <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
        {name}
      </Text>
    </XStack>
  );
}

function CompleteTurn() {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);

  const portal1 = warStore.portal[0];
  const portal2 = warStore.portal[1];
  const portalExists = portal1 && portal2;

  const completeTurn = useCallback(async () => {
    await execute(conquestService.completeTurn());
  }, []);

  return (
    <V flex={1} width="100%">
      <ScrollView flex={1} space="$1" padding="$0.5">
        <H5 lineHeight={15} fontWeight="bold">
          Turn Summary
        </H5>
        <YStack padding="$0.5" space="$2">
          <V space="$0.5">
            <H5 lineHeight={15}>Portal</H5>
            <YStack paddingLeft="$0.5">
              {portalExists && warDerived.portalNames ? (
                <XStack>
                  <TileInfo
                    width="40%"
                    owner={warDerived.portalNames[0][1]}
                    name={warDerived.portalNames[0][0]}
                  />
                  {/*<Text width="40%">{warDerived.portalNames[0]}</Text>*/}
                  <Text textAlign="center" flex={1}>
                    →
                  </Text>
                  <TileInfo
                    width="40%"
                    owner={warDerived.portalNames[1][1]}
                    name={warDerived.portalNames[1][0]}
                  />
                  <Text flex={1}></Text>
                </XStack>
              ) : (
                <Text>No portal set</Text>
              )}
            </YStack>
          </V>
          <V space="$0.5">
            <H5 lineHeight={15}>Deployments</H5>
            <YStack paddingLeft="$0.5">
              {warStore.deployments.length > 0 ? (
                Object.values(warDerived.deployments).map(
                  ([name, troops, owner]) => (
                    <XStack>
                      <TileInfo width="40%" owner={owner} name={name} />
                      <Text textAlign="center" flex={1}>
                        →
                      </Text>
                      <Text textAlign="left" flex={1}>
                        {troops}
                      </Text>
                      <Text width="40%"></Text>
                    </XStack>
                  )
                )
              ) : (
                <Text>No deployments</Text>
              )}
            </YStack>
          </V>
          <V space="$0.5">
            <H5 lineHeight={15}>Battles</H5>
            <YStack paddingLeft="$0.5" space="$0.5">
              {warStore.battles.length > 0 ? (
                warDerived.battles.map((b) => {
                  return (
                    <XStack alignItems="center">
                      <TileInfo
                        width="35%"
                        owner={b.aggressor}
                        name={b.attackingFromTerritory}
                      />
                      <Badge
                        color={b.totalAggressorChange < 0 ? 'red' : 'blue'}
                        title={b.totalAggressorChange.toString()}
                      />
                      <Text textAlign="center" flex={1}>
                        →
                      </Text>
                      <TileInfo
                        width="35%"
                        owner={b.defender}
                        name={b.defendingTerritory}
                      />
                      <Badge
                        color={b.totalDefenderChange < 0 ? 'red' : 'blue'}
                        title={b.totalDefenderChange.toString()}
                      />
                    </XStack>
                  );
                })
              ) : (
                <Text>No battles</Text>
              )}
            </YStack>
          </V>
        </YStack>
      </ScrollView>
      <PrimaryButton onPress={completeTurn}>Complete Turn</PrimaryButton>
    </V>
  );
}

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
        if (typeof selectedTileIndex === 'undefined') {
          return;
        }

        if (
          sv.current &&
          Number(selectedTileIndex) > -1 &&
          !disableListMovement.current
        ) {
          sv.current.scrollTo(Number(selectedTileIndex) * 44);
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

  if (!warStore.active) {
    return (
      <V padding="$1">
        <Scoreboard />
      </V>
    );
  }

  if (warStore.players.length < warStore.playerLimit && warStore.round === 0) {
    return (
      <ResponsiveTabs menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
        <LobbyTabs />
      </ResponsiveTabs>
    );
  }

  return (
    <ResponsiveTabs menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
      <Tabs
        defaultValue="tab1"
        orientation="horizontal"
        flexDirection="column"
        borderRadius={5}
        borderWidth={1}
        maxHeight={'100%'}
        height="100%"
        overflow="hidden"
        // borderColor="$borderColor"
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
          {/*<Tabs.Tab borderWidth={0} flex={1} value="tab4">*/}
          {/*  <SizableText fontFamily="$body">Log</SizableText>*/}
          {/*</Tabs.Tab>*/}
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
                paddingLeft={6}
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
                  <WarStatusBadges />
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
                        <RadioGroup.Item value={'portal'} id={'1'} size={'$3'}>
                          <RadioGroup.Indicator />
                        </RadioGroup.Item>
                        <Label
                          lineHeight={0}
                          paddingLeft="$0.5"
                          size={'$3'}
                          htmlFor={'1'}
                        >
                          Portal
                        </Label>
                      </XStack>
                      <XStack alignItems="center">
                        <RadioGroup.Item value={'deploy'} id={'2'} size={'$3'}>
                          <RadioGroup.Indicator />
                        </RadioGroup.Item>

                        <Label
                          lineHeight={0}
                          paddingLeft="$0.5"
                          size={'$3'}
                          htmlFor={'2'}
                        >
                          Deploy
                        </Label>
                      </XStack>
                      <XStack alignItems="center">
                        <RadioGroup.Item value={'attack'} id={'3'} size={'$3'}>
                          <RadioGroup.Indicator />
                        </RadioGroup.Item>

                        <Label
                          lineHeight={0}
                          paddingLeft="$0.5"
                          size={'$3'}
                          htmlFor={'3'}
                        >
                          Attack
                        </Label>
                      </XStack>
                      <XStack alignItems="center">
                        <RadioGroup.Item
                          value={'complete'}
                          id={'4'}
                          size={'$3'}
                        >
                          <RadioGroup.Indicator />
                        </RadioGroup.Item>

                        <Label
                          lineHeight={0}
                          paddingLeft="$0.5"
                          size={'$3'}
                          htmlFor={'4'}
                        >
                          Complete
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
              {warStore.turnAction === 'complete' && <CompleteTurn />}
              {warStore.turnAction !== 'complete' && (
                <V flex={1} width="100%">
                  <XStack marginBottom="$0.5" paddingHorizontal="$0.5">
                    <XStack
                      flex={1}
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <XStack minWidth="$1">
                        <Label lineHeight={0} htmlFor="first">
                          Filter
                        </Label>
                      </XStack>
                      <V paddingLeft="$0.5" flex={1}>
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
                      </V>
                    </XStack>
                    <XStack
                      flex={1}
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <XStack minWidth="$1" paddingHorizontal="$0.75">
                        <Label lineHeight={0} htmlFor="first">
                          Sort
                        </Label>
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
                  <ScrollView ref={sv}>
                    <TilesList setSelectedTile={setSelectedTile} />
                  </ScrollView>
                </V>
              )}
            </>
          ) : (
            <View style={{ width: '100%', display: 'flex' }}>
              <V flex={1} alignItems="flex-end">
                <WarStatusBadges />
              </V>
            </View>
          )}
        </TabsContent>
        <TabsContent value="tab2">
          <YStack width="100%" height="100%" space="$1">
            <V>
              {warStore.players.map(({ id, userName, color }, i) => (
                <V
                  key={`${id}_${i}`}
                  flexDirection="row"
                  alignItems="center"
                  space="$1"
                >
                  <V flexDirection="row" alignItems="center" space="$0.5">
                    <Text width="$1">{i + 1}</Text>
                    <UserCircle2 color={color} />
                  </V>
                  <Text flex={1}>{userName}</Text>
                  <Text
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {id}
                  </Text>
                </V>
              ))}
            </V>
          </YStack>
        </TabsContent>
        <TabsContent value="tab3">
          <Scoreboard />
        </TabsContent>
      </Tabs>
    </ResponsiveTabs>
  );
}

function Scoreboard() {
  const { services } = useEndApi();
  const { warService } = services;
  const warDerived = useSnapshot(warService.derived);
  return (
    <YStack backgroundColor="transparent" width="100%" height="100%" space="$1">
      <V>
        {warDerived.scoreboard.map(({ totalTroops, userName, color }, i) => (
          <V
            key={`${userName}_${i}`}
            flexDirection="row"
            alignItems="center"
            space="$1"
          >
            <V flexDirection="row" alignItems="center" space="$0.5">
              <Text width="$1">{i + 1}</Text>
              <UserCircle2 color={color} />
            </V>
            <Text flex={1}>{userName}</Text>
            <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {totalTroops}
            </Text>
          </V>
        ))}
      </V>
    </YStack>
  );
}

function WarStatusBadges() {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warDerived = useSnapshot(warService.derived);
  return (
    <V
      alignItems="center"
      paddingRight={6}
      flexDirection="row"
      height={36}
      space="$0.5"
    >
      <Badge color="green" title={warDerived.currentTurnAndRound} />
      <Badge color="red" title={warDerived.remainingTroops.toString()} />
    </V>
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

  if (tile.owner !== warStore.userId) {
    return null;
  }

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

function PortalSelection({ tile }: { tile: Partial<Tile> }) {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);

  const [portal1] = warService.tileIdAndCoords(warStore.portal[0]);
  const [portal2] = warService.tileIdAndCoords(warStore.portal[1]);

  const portal1Change = useCallback(() => {
    const [_, coords] = warService.tileIdAndCoords(tile.id);
    warService.setSettingPortalCoords('first');
    warService.setPortal(coords);
  }, []);

  const portal2Change = useCallback(() => {
    const [_, coords] = warService.tileIdAndCoords(tile.id);
    warService.setSettingPortalCoords('second');
    warService.setPortal(coords);
  }, []);

  return (
    <>
      <Checkbox
        id={''}
        size={'$4'}
        label=""
        checkboxProps={{
          checked: portal1 === tile.id,
          onCheckedChange: portal1Change,
        }}
      />
      <Checkbox
        id={''}
        size={'$4'}
        label=""
        checkboxProps={{
          checked: portal2 === tile.id,
          onCheckedChange: portal2Change,
        }}
      />
    </>
  );
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
                  <Hexagon
                    fill={t.id === selectedTileId ? colors[t.owner] : undefined}
                    color={colors[t.owner]}
                  />
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
                  {warStore.turnAction === 'portal' && (
                    <PortalSelection tile={t} />
                  )}
                  <Text textAlign="right" minWidth={20}>
                    {t.troopCount}
                  </Text>
                </View>
              }
              pressTheme
              onPress={() => {
                setSelectedTile(t.id);
              }}
            />
            {t.id === selectedTileId ? <TileActions tile={t} /> : <></>}
          </>
        );
      })}
    </>
  );
}
