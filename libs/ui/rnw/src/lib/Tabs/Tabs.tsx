import {
  H5,
  Input,
  Section,
  Separator,
  SizableText,
  Text,
  View,
  Tabs,
  Spacer,
  ListItem,
  ScrollView,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { Slider } from '@miblanchard/react-native-slider';
import { Sun, tw } from '../components';
import { PrimaryButton } from '../Display';
import { CircleDot, Crosshair, Hexagon } from '@tamagui/lucide-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useResponsive } from '../Layout';
import { derived, hexasphereProxy } from '@end/hexasphere';
import { useSnapshot } from 'valtio';
import Select from '../Select/Select';
import { subscribeKey } from 'valtio/utils';

export function TabsContainer({
  menuOpen,
  selectTile,
  newPlanet,
}: {
  newPlanet: () => void;
  menuOpen: boolean;
  selectTile: (id: string, tileList?: { scrollTo(): void }) => void;
}) {
  const hs = useSnapshot(hexasphereProxy);
  const { bp } = useResponsive(menuOpen, 1297);
  const sv = useRef<ScrollView | any>(null);

  useEffect(() => {
    const unsubscribe = subscribeKey(
      derived,
      'selectedTileIndex',
      (selectedTileIndex) => {
        sv.current.scrollTo(selectedTileIndex * 67);
      }
    );

    return () => unsubscribe();
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
                <SizableText fontFamily="$body">Start</SizableText>
              </Tabs.Tab>
              <Tabs.Tab borderWidth={0} flex={1} value="tab2">
                <SizableText fontFamily="$body">Territories</SizableText>
              </Tabs.Tab>
            </Tabs.List>
            <Separator />
            <TabsContent value="tab1">
              <View>
                <Select
                  label="Number of players"
                  items={[2, 3, 4, 5, 6, 7, 8, 9, 10]}
                />
                <Spacer />
                <PrimaryButton onPress={newPlanet}>Start game</PrimaryButton>
              </View>
            </TabsContent>
            <TabsContent value="tab2" style={tw`h-full`}>
              <View style={tw`h-full overflow-scroll w-full`}>
                <ScrollView ref={sv}>
                  {hs.tiles.map((t) => (
                      <TileListItem
                        id={t.id}
                        name={t.name}
                        selectTile={selectTile}
                        selected={t.selected}
                        raised={t.raised}
                      />
                    ))}
                </ScrollView>
              </View>
            </TabsContent>
          </Tabs>
        </View>
        <PrimaryButton onPress={newPlanet}>New Planet</PrimaryButton>
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
