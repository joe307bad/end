import React from 'react';
import { View, Text } from 'react-native';
import { tw } from '../components';

const _renderColors = [
  'bg-red-200',
  'bg-red-200',
  'bg-green-800',
  'bg-green-800',
];

export function Badge({
  title,
  color: c,
  styles,
}: {
  title?: string;
  color?: string;
  styles?: string;
}) {
  const color = c ?? 'blue';
  return (
    <View style={tw`items-center ${styles}`}>
      <View style={tw`bg-${color}-200 px-3 py-1 rounded-full`}>
        <Text style={tw`${color}-800 font-semibold text-center`}>
          {title}
        </Text>
      </View>
    </View>
  );
}
