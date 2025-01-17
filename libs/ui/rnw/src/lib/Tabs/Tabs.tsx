import {
  Section,
  Separator,
  SizableText,
  View,
  Tabs,
  Spacer,
  ListItem,
  ScrollView,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { tw } from '../components';
import { PrimaryButton } from '../Display';
// import { CircleDot, Crosshair, Hexagon } from '@tamagui/lucide-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { useResponsive } from '../Layout';
import { useSnapshot } from 'valtio';
import Select from '../Select/Select';
import { subscribeKey } from 'valtio/utils';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { getOrUndefined } from 'effect/Option';

export function TabsContainer({
  menuOpen,
  newPlanet,
  startGame,
}: {
  newPlanet: () => void;
  menuOpen: boolean;
  startGame: () => void;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warDerived = useSnapshot(warService.derived);
  const warStore = useSnapshot(warService.store);
  const { bp } = useResponsive(menuOpen, 1000);
  const sv = useRef<ScrollView | any>(null);

  useEffect(() => {
    const unsubscribe = subscribeKey(
      warService.derived,
      'selectedTileIndex',
      (selectedTileIndex) => {
        if (!selectedTileIndex) {
          return;
        }

        if (sv.current && selectedTileIndex > -1) {
          sv.current.scrollTo(selectedTileIndex * 67);
        }
      }
    );

    warService.setFilter('all');

    return () => unsubscribe();
  }, []);

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
            // borderColor="$borderColor"
            style={bp(['', `${menuOpen ? '' : 'hidden'}`, '', 'visible'])}
          >
            <Tabs.List
              separator={<Separator vertical />}
              disablePassBorderRadius="bottom"
            >
              <Tabs.Tab borderWidth={0} flex={1} value="tab1">
                <SizableText fontFamily="$body">Start</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab2">
                <SizableText fontFamily="$body">Territories</SizableText>
              </Tabs.Tab>
            </Tabs.List>
            <Separator />
            <TabsContent value="tab1">
              <ScrollView width="100%">
                <Select
                  label="Number of players"
                  onValueChange={warService.setPlayerLimit}
                  value={warStore.playerLimit.toString()}
                  items={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => ({
                    key: p.toString(),
                    value: p.toString(),
                  }))}
                />
                <Select
                  label="Round limit"
                  onValueChange={warService.setRoundLimit}
                  value={warStore.roundLimit.toString()}
                  items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => ({
                    key: p.toString(),
                    value: p.toString(),
                  }))}
                />
                <Select
                  label="Battle limit"
                  onValueChange={warService.setBattleLimit}
                  value={warStore.battleLimit.toString()}
                  items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => ({
                    key: p.toString(),
                    value: p.toString(),
                  }))}
                />
                <Spacer />
                <PrimaryButton onPress={startGame}>Start game</PrimaryButton>
              </ScrollView>
            </TabsContent>
            <TabsContent value="tab2" style={tw`h-full`}>
              <View style={tw`h-full overflow-scroll w-full`}>
                <ScrollView ref={sv}>
                  {warDerived.sortedTiles.map((t) => (
                    <TileListItem
                      key={t.id}
                      id={t.id}
                      name={t.name}
                      raised={t.raised}
                    />
                  ))}
                </ScrollView>
              </View>
            </TabsContent>
          </Tabs>
        </View>
        <PrimaryButton onPress={newPlanet}>New Planet</PrimaryButton>
        <PrimaryButton onPress={onSync}>Sync</PrimaryButton>
      </View>
      <View onPress={() => {}}>
        {/*<CircleDot*/}
        {/*  color="white"*/}
        {/*  size="$2"*/}
        {/*  style={bp(['block text-white self-end', '', '', 'hidden'])}*/}
        {/*/>*/}
      </View>
    </Section>
  );
}

const TileListItem = React.memo(function ({
  name,
  raised,
  id,
}: {
  id: string;
  name?: string;
  raised?: boolean;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  return (
    <ListItem
      display={raised ? 'flex' : 'none'}
      padding="$1"
      hoverTheme
      // icon={Hexagon}
      title={<View style={{ cursor: 'pointer' }}>{name}</View>}
      pressTheme
      onPress={() => warService.setSelectedTileIdOverride(id)}
      // iconAfter={
      //   // getOrUndefined(warStore.selectedTileId) === id ? Crosshair : null
      // }
    />
  );
});
