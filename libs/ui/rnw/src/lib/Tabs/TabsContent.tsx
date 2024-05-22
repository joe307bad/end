import React from 'react';
import { Tabs, TabsContentProps } from 'tamagui';

export const TabsContent = (props: TabsContentProps) => {
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
      maxHeight={"100%"}
      {...props}
    >
      {props.children}
    </Tabs.Content>
  );
};
