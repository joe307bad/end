import React, { useCallback } from 'react';
import { useSnapshot } from 'valtio';
import { Label, RadioGroup, View as V, XStack, Text } from 'tamagui';
import { PrimaryButton } from '../Display';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';
import { SelectDemoItem } from '@end/components';
import { CheckCheck, XCircle } from '@tamagui/lucide-icons';
import { Option as O } from 'effect';
import { getOrUndefined, isSome } from 'effect/Option';
import { isRight } from 'effect/Either';

export function BattleSelection() {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);
  const enabled =
    isSome(warStore.territoryToAttack) && isSome(warStore.selectedTileId);

  return (
    <XStack alignItems="center">
      {warStore.battles.length > 0 ? (
        <V>
          <XStack space="$1" paddingLeft="3px">
            <SelectDemoItem
              id="battle-select"
              // value={Object.values(
              //   getOrUndefined(warStore) ?? {}
              // ).join(',')}
              // onValueChange={warService.setDeployTo}
              items={warStore.battles.map((b) => ({
                key: b.id ?? '',
                value: b.id ?? '',
              }))}
              native
            />
          </XStack>
        </V>
      ) : (
        <></>
      )}
      <V flex={1}></V>
      <V alignItems="flex-end" width="$6" justifyContent="center">
        <PrimaryButton
          disabled={!enabled}
          onPress={conquestService.engage}
          height="$2"
          withIcon={true}
        >
          <V flexDirection="row" space="$0.5" alignItems="center" padding="$1">
            {enabled ? (
              <CheckCheck size={'$1'} color={'green'} />
            ) : (
              <XCircle size={'$1'} color={'red'} />
            )}
            <Text>Engage</Text>
          </V>
        </PrimaryButton>
      </V>
    </XStack>
  );
}
