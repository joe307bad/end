import React, { ReactNode, useState } from 'react';
import {
  H5,
  Input,
  Section,
  Separator,
  SizableText,
  Tabs,
  TabsContentProps,
  Text,
} from 'tamagui';
import { View } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { PrimaryButton } from '../Display';
import { tw } from '../components';
import { Hexasphere } from '@end/hexasphere';

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$background"
      key="tab3"
      padding="$2"
      alignItems="center"
      justifyContent="center"
      flex={1}
      borderColor="$background"
      borderTopLeftRadius={0}
      borderTopRightRadius={0}
      borderRadius={5}
      borderWidth={1}
      borderLeftWidth={0}
      borderRightWidth={0}
      {...props}
    >
      {props.children}
    </Tabs.Content>
  );
};

export function Planet({
  children,
  setReset,
  reset,
  tiles,
  setSelectedTile,
  selectedTile,
  hexasphere,
}: {
  setReset(r: number): void;
  reset: number;
  selectedTile?: { x: number; y: number; z: number };
  setSelectedTile(id: { x: number; y: number; z: number }): void;
  hexasphere: any;
  tiles: any;
  children: (
    hexasphere: JSX.Element,
    controls: JSX.Element,
    footer: JSX.Element
  ) => ReactNode;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);

  return (
    <Section style={tw`h-full w-full relative overflow-hidden`}>
      {children(
        <Hexasphere
          key={reset}
          rotateX={rotateX}
          rotateY={rotateY}
          rotateZ={rotateZ}
          tiles={tiles}
          hexasphere={hexasphere}
          selected={selectedTile}
          setSelected={setSelectedTile}
        />,
        <Section style={tw`absolute right-[20px] top-[20px] z-10 w-[500px]`}>
          <Tabs
            defaultValue="tab3"
            orientation="horizontal"
            flexDirection="column"
            borderRadius={5}
            borderWidth={1}
            overflow="hidden"
            borderColor="$borderColor"
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
                  onValueChange={(value: any) => setRotateX(value[0])}
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
                  onValueChange={(value: any) => setRotateY(value[0])}
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
                  onValueChange={(value: any) => setRotateZ(value[0])}
                />
              </View>
            </TabsContent>

            <TabsContent value="tab3" style={tw`h-full`}>
              <Section style={tw`max-h-80 overflow-scroll w-full`}>
                {tiles.map((t: any) => (
                  <PrimaryButton onPress={() => setSelectedTile(t.centerPoint)}>
                    {t.id}
                  </PrimaryButton>
                ))}
              </Section>
            </TabsContent>

            <TabsContent value="tab4">
              <H5>Notifications</H5>
            </TabsContent>
          </Tabs>
        </Section>,
        <PrimaryButton onPress={() => setReset(Math.random())}>
          New Planet
        </PrimaryButton>
      )}
    </Section>
  );
}
