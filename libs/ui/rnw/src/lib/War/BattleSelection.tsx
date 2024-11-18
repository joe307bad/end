import React, { useCallback } from 'react';
import { useSnapshot } from 'valtio';
import { Label, RadioGroup, View as V, XStack } from 'tamagui';
import { PrimaryButton } from '../Display';
import { useEndApi } from '@end/data/web';
import { execute } from '@end/data/core';

export function BattleSelection() {
  const { services } = useEndApi();
  const { warService, conquestService } = services;
  const startBattle = useCallback(async () => {
    await execute(conquestService.startBattle());
  }, []);
  const warStore = useSnapshot(warService.store);
  const warDerived = useSnapshot(warService.derived);

  return (
    <XStack alignItems="center">
      <V>
        <XStack space="$1" paddingLeft="3px">
          <XStack alignItems="center">
            <RadioGroup
              onValueChange={warService.setActiveBattle}
              aria-labelledby="Select one item"
              name="form"
            >
              <XStack space="$1">
                {warDerived.battles.map((b) => {
                  if (!b.id) {
                    return <></>;
                  }
                  return (
                    <XStack alignItems="center">
                      <RadioGroup.Item value={b.id} id={b.id} size={'$3'}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label
                        style={{ lineHeight: 0 }}
                        lineHeight={0}
                        paddingLeft="$0.5"
                        size={'$3'}
                        htmlFor={b.id}
                      >
                        {b.id}
                      </Label>
                    </XStack>
                  );
                })}
              </XStack>
            </RadioGroup>
          </XStack>
        </XStack>
      </V>
      <V flex={1}></V>
      <V alignItems="flex-end" width="$6" justifyContent="center">
        <PrimaryButton onPress={startBattle} height="$2">
          Engage
        </PrimaryButton>
      </V>
    </XStack>
  );
}
