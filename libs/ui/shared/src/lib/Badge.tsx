import React from 'react';
import { View, Text, ViewProps } from 'tamagui';

const colors = (color?: string) => {
  switch (color) {
    case 'red':
      return ['lightcoral', 'darkred'];
    case 'green':
      return ['lightgreen', 'green'];
    case 'purple':
      return ['#e4acef', '#490049'];
    case 'orange':
      return ['lightsalmon', 'rgb(71, 17, 0)'];
    case 'blue':
      return ['lightblue', 'blue'];
    case 'yellow':
      return ['#39ff99', 'rgb(0, 29, 13)'];
    default:
      return ['lightblue', 'blue'];
  }
};

export function Badge({
  title,
  color: c,
  styles,
  ...rest
}: {
  title?: string;
  color?: string;
  styles?: string;
} & ViewProps) {
  const [light, dark] = colors(c);
  return (
    <View alignItems="center" {...rest}>
      <View
        backgroundColor={light}
        paddingHorizontal="14px"
        paddingVertical="14px"
        borderRadius="9999px"
        position="relative"
      >
        <Text
          lineHeight={0}
          fontWeight="bold"
          textAlign="center"
          color={dark}
          fontSize={14}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
