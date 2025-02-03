import React, { ReactElement } from 'react';
import { View, Text, XStack } from 'tamagui';
import PanTool from '@mui/icons-material/PanTool';

export function Callout({
  type,
  children,
}: {
  type: 'warning';
  children: ReactElement;
}) {
  const [title, borderColor, backgroundColor, icon] = (() => {
    switch (type) {
      case 'warning':
        return [
          'Warning',
          'red',
          '#502028',
          <PanTool style={{ color: 'red' }} />,
        ];
    }
  })();

  return (
    <View
      marginVertical="$1"
      paddingHorizontal="$1"
      paddingBottom="$1"
      borderLeftWidth="$0.5"
      borderLeftColor={borderColor}
      backgroundColor={backgroundColor}
    >
      <XStack alignItems="center" gap="$1">
        <View>{icon}</View>
        <Text fontWeight="bold" textTransform="uppercase" marginVertical="$1">
          {title}
        </Text>
      </XStack>
      <View>{children}</View>
    </View>
  );
}
