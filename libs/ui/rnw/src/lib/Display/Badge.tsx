import React from 'react';
import { View, Text } from 'react-native';
import { tw } from '../components';

export function Badge({ title, color }: { title?: string; color?: string }) {
  return (
    <View style={tw`pt-12 items-center`}>
      <View style={tw`bg-blue-200 px-3 py-1 rounded-full`}>
        <Text style={tw`text-blue-800 font-semibold text-center`}>{title}</Text>
      </View>
    </View>
  );
}
