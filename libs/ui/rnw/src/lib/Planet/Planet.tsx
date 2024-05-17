import React, { ReactNode, useCallback, useMemo, useState } from 'react';
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
import { getPointInBetweenByPerc, PortalPath, tw } from '../components';
import {
  Coords,
  Hexasphere,
  RenderedTile,
  THexasphere,
  Tile,
} from '@end/hexasphere';
import { useResponsive } from '../Layout';
import { MenuSquare, CircleDot } from '@tamagui/lucide-icons';
import { faker } from '@faker-js/faker';
import { TabsContent } from '../Tabs';

export function Planet({
  children,
  setReset,
  reset,
  tiles,
  hexasphere,
}: {
  setReset(r: number): void;
  reset: number;
  hexasphere: THexasphere;
  tiles: RenderedTile[];
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

  const [selectedTile, setSelectedTileState] = useState<{
    x: number;
    y: number;
    z: number;
  }>();

  const setSelectedTile = useCallback((id: Coords) => {
    setSelectedTileState(
      (prevId: { x: number; y: number; z: number } | undefined) => {
        const { x, y, z } = prevId ?? {};
        const { x: x1, y: y1, z: z1 } = id ?? {};
        return JSON.stringify({ x, y, z }) ===
          JSON.stringify({ x: x1, y: y1, z: z1 })
          ? undefined
          : id;
      }
    );
  }, [setSelectedTileState]);

  return (
    <Section style={tw`h-full w-full relative overflow-hidden`}>
      {children(
        <></>,
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
                {tiles.map((t) => (
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
