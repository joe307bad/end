import { View, Text } from 'tamagui';
import { getOrUndefined } from 'effect/Option';
import { useSnapshot } from 'valtio';
import { useEndApi } from '@end/data/web';
import React, { useMemo } from 'react';
import { tw } from '@end/components';

export default function ActiveBattle({ battleId }: { battleId?: string }) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const battle = useMemo(
    () => warStore.battles.find((b) => b.id === battleId),
    []
  );
  const { troopCount, name } = useMemo(
    () =>
      warStore.tiles.find((t) => t.id === battle?.attackingFromTerritory) ?? {
        troopCount: 0,
        name: '',
      },
    [warStore.tiles]
  );

  const { troopCount: troopCountDefending, name: nameDefending } = useMemo(
    () =>
      warStore.tiles.find((t) => t.id === battle?.defendingTerritory) ?? {
        troopCount: 0,
        name: '',
      },
    [warStore.tiles]
  );

  if (!battle) {
    return <></>;
  }

  return (
    <View padding="$0.5" space="$0.5">
      <View display="flex" style={tw.style('flex-row')}>
        <Text
          overflow="hidden"
          textOverflow="ellipsis"
          wordWrap="normal"
          style={tw.style('flex-1')}
        >
          {name}
        </Text>
        <Text>{troopCount}</Text>
      </View>
      <View display="flex" style={tw.style('flex-row')}>
        <Text
          overflow="hidden"
          textOverflow="ellipsis"
          wordWrap="normal"
          style={tw.style('flex-1')}
        >
          {nameDefending}
        </Text>
        <Text>{troopCountDefending}</Text>
      </View>
    </View>
  );
}
