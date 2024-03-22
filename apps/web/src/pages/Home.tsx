import { Home as H, Planet, PrimaryButton, tw } from '@end/components';
import { database, sync } from '@end/wm/web';
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useWindowDimensions, View } from 'react-native';
import { OrbitControls } from '@react-three/drei';
import { H5, Separator, SizableText, Tabs, TabsContentProps } from 'tamagui';

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

export default function Home() {
  const [seed, setSeed] = useState(Math.random());
  const { width } = useWindowDimensions();

  return (
    <H database={database} sync={sync} apiUrl={process.env.API_BASE_URL}>
      <View style={tw`absolute w-[500px] right-0 h-full z-10`}>
        <View style={tw`flex flex-row h-full`}>
          <View style={tw`w-[500px] items-center justify-center  h-full`}>
            <View
              style={tw`p-5 backdrop-blur-md backdrop-brightness-150 w-90 h-90`}
            >
              <Tabs
                defaultValue="tab1"
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
                    <SizableText fontFamily="$body">Debug</SizableText>
                  </Tabs.Tab>
                </Tabs.List>
                <Separator />
                <TabsContent value="tab1">
                  <H5>Profile</H5>
                </TabsContent>

                <TabsContent value="tab2">
                  <H5>Connections</H5>
                </TabsContent>

                <TabsContent value="tab3">
                  <H5>Notifications</H5>
                </TabsContent>
              </Tabs>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{ overflow: 'hidden', height: '100%', width: '100%', flex: 1 }}
      >
        <Canvas
          style={{ flex: 1, width: '150%', marginLeft: -400 }}
          camera={{ position: [0, width < 600 ? 300 : 160, 25], fov: 45 }}
        >
          <OrbitControls />
          <Planet seed={seed} />
        </Canvas>
      </View>
      <PrimaryButton onPress={() => setSeed(Math.random())}>
        New Planet
      </PrimaryButton>
    </H>
  );
}
