import React from 'react';
import { View, Text } from 'react-native';
import { tw } from '../components';

export function Badge({
  title,
  color,
  styles,
}: {
  title?: string;
  color?: string;
  styles?: string;
}) {
  return (
    <View style={tw`items-center ${styles}`}>
      <View style={tw`bg-blue-200 px-3 py-1 rounded-full`}>
        <Text style={tw`text-blue-800 font-semibold text-center`}>{title}</Text>
      </View>
    </View>
  );
}
