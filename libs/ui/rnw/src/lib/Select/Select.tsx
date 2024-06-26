import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons';
import React from 'react';

import { useMemo, useState } from 'react';

import type { FontSizeTokens, SelectProps } from 'tamagui';

import {
  Adapt,
  Label,
  Select as S,
  Sheet,
  XStack,
  YStack,
  getFontSize,
} from 'tamagui';

export default function Select({
  label,
  items,
}: {
  label: string;
  items: any[];
}) {
  return (
    <XStack gap="$4">
      <Label htmlFor="select-demo-2">{label}</Label>

      <SelectDemoItem id="select-demo-2" items={items} native />
    </XStack>
  );
}

export function SelectDemoItem(props: SelectProps & { items: any[] }) {
  const [val, setVal] = useState('apple');
  return (
    <S
      value={val}
      onValueChange={setVal}
      size={'$1'}
      disablePreventBodyScroll
      {...props}
    >
      <S.Trigger width={220} iconAfter={ChevronDown}>
        <S.Value placeholder="Something" />
      </S.Trigger>
      <S.Content zIndex={200000}>
        <S.ScrollUpButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <ChevronUp size={20} />
          </YStack>
        </S.ScrollUpButton>
        <S.Viewport
          // to do animations:
          // animation="quick"
          // animateOnly={['transform', 'opacity']}
          // enterStyle={{ o: 0, y: -10 }}
          // exitStyle={{ o: 0, y: 10 }}
          minWidth={200}
        >
          <S.Group>
            <S.Label>Number of players</S.Label>

            {/* for longer lists memoizing these is useful */}

            {useMemo(
              () =>
                props.items.map((item, i) => {
                  return (
                    <S.Item
                      index={i}
                      key={item}
                      value={item}
                    >
                      <S.ItemText>{item}</S.ItemText>

                      <S.ItemIndicator marginLeft="auto">
                        <Check size={16} />
                      </S.ItemIndicator>
                    </S.Item>
                  );
                }),

              [props.items]
            )}
          </S.Group>

          {/* Native gets an extra icon */}

          {props.native && (
            <YStack
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              width={'$4'}
              pointerEvents="none"
            >
              <ChevronDown
                size={getFontSize((props.size as FontSizeTokens) ?? '$true')}
              />
            </YStack>
          )}
        </S.Viewport>
        <S.ScrollDownButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <ChevronDown size={20} />
          </YStack>
        </S.ScrollDownButton>
      </S.Content>
    </S>
  );
}
