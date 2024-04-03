import React, { ReactNode, useMemo, useState } from 'react';
import {
  H5,
  Input,
  Section,
  Separator,
  SizableText,
  Tabs,
  TabsContentProps,
  Text,
  View,
} from 'tamagui';
import { Slider } from '@miblanchard/react-native-slider';
import { PrimaryButton } from '../Display';
import { PortalPath, tw } from '../components';
import { Hexasphere } from '@end/hexasphere';
import { useResponsive } from '../Layout';
import { MenuSquare, CircleDot } from '@tamagui/lucide-icons';
import { faker } from '@faker-js/faker';

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
  const [menuOpen, toggleMenu] = useState<boolean>(false);
  const { bp } = useResponsive(menuOpen, 1297);

  const [from, to] = useMemo(() => {
    const from = faker.number.int({ min: 0, max: 161 });
    var to = faker.number.int({ min: 0, max: 161 });

    while (from === to) {
      to = faker.number.int({ min: 0, max: 161 });
    }

    return [from, to];
  }, []);

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
          portal={
            <PortalPath
              from={tiles[from].centerPoint}
              to={tiles[to].centerPoint}
            />
          }
        />,
        <Section
          style={bp([
            'absolute z-10 w-[500px] max-w-full',
            'bottom-[50px] right-[0px]',
            'bottom-[50px] right-[0px]',
            'top-[20px] right-[20px] ',
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
          <View onPress={() => toggleMenu((prevState) => !prevState)}>
            <CircleDot
              color="white"
              size="$2"
              style={bp(['block text-white self-end', '', '', 'hidden'])}
            />
          </View>
        </Section>,
        <PrimaryButton onPress={() => setReset(Math.random())}>
          New Planet
        </PrimaryButton>
      )}
    </Section>
  );
}
