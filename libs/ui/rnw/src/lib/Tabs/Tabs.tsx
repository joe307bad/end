import {
  H5,
  Input,
  Section,
  Separator,
  SizableText,
  Text,
  View,
  Tabs,
} from 'tamagui';
import { TabsContent } from './TabsContent';
import { Slider } from '@miblanchard/react-native-slider';
import { tw } from '../components';
import { PrimaryButton } from '../Display';
import { CircleDot } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { useResponsive } from '../Layout';
import { hexasphereProxy } from '@end/hexasphere';
import { useSnapshot } from 'valtio';

export function TabsContainer({
  menuOpen,
  selectTile,
}: {
  menuOpen: boolean;
  selectTile: (id: string) => void;
}) {
  const hs = useSnapshot(hexasphereProxy);
  const { bp } = useResponsive(menuOpen, 1297);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  return (
    <Section
      style={bp([
        'z-10 max-w-full',
        'relative w-full',
        '',
        'absolute w-[500px] top-[20px] right-[20px] w-[500px] ',
      ])}
    >
      <Tabs
        defaultValue="tab3"
        orientation="horizontal"
        flexDirection="column"
        borderRadius={5}
        borderWidth={1}
        overflow="hidden"
        borderColor="$borderColor"
        style={bp(['', `${menuOpen ? '' : 'hidden'}`, '', 'visible'])}
      >
        <Tabs.List
          separator={<Separator vertical />}
          disablePassBorderRadius="bottom"
          aria-label="Manage your account"
        >
          <Tabs.Tab borderWidth={0} flex={1} value="tab1">
            <SizableText fontFamily="$body">Details</SizableText>
          </Tabs.Tab>
          <Tabs.Tab borderWidth={0} flex={1} value="tab2">
            <SizableText fontFamily="$body">View</SizableText>
          </Tabs.Tab>
          <Tabs.Tab borderWidth={0} flex={1} value="tab3">
            <SizableText fontFamily="$body">Tiles</SizableText>
          </Tabs.Tab>
          <Tabs.Tab borderWidth={0} flex={1} value="tab4">
            <SizableText fontFamily="$body">Debug</SizableText>
          </Tabs.Tab>
        </Tabs.List>
        <Separator />
        <TabsContent value="tab1">
          <Input padding="$0.5" width="100%" placeholder="Planet Name" />
        </TabsContent>

        <TabsContent value="tab2">
          <View
            style={{
              flex: 1,
              marginLeft: 10,
              marginRight: 10,
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Text>Rotate X</Text>
            <Slider
              value={rotateX}
              onValueChange={(value) => setRotateX(value[0])}
            />
          </View>
          <View
            style={{
              flex: 1,
              marginLeft: 10,
              marginRight: 10,
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Text>Rotate Y</Text>
            <Slider
              value={rotateY}
              onValueChange={(value) => setRotateY(value[0])}
            />
          </View>
          <View
            style={{
              flex: 1,
              marginLeft: 10,
              marginRight: 10,
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Text>Rotate Z</Text>
            <Slider
              value={rotateZ}
              onValueChange={(value) => setRotateZ(value[0])}
            />
          </View>
        </TabsContent>

        <TabsContent value="tab3" style={tw`h-full`}>
          <Section style={tw`max-h-80 overflow-scroll w-full`}>
            {hs.tiles.map((t) => (
              <PrimaryButton onPress={() => selectTile(t.id)}>
                {t.id}
              </PrimaryButton>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="tab4">
          <H5>Notifications</H5>
        </TabsContent>
      </Tabs>
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
