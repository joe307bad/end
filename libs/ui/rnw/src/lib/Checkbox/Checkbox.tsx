import {
  Label,
  XStack,
  Checkbox as Cb,
  SizeTokens,
  CheckboxProps,
} from 'tamagui';
// import { Check as CheckIcon } from '@tamagui/lucide-icons';
import React from 'react';

export function Checkbox({
  id,
  size,
  checkboxProps,
  label,
}: {
  id: string;
  size: SizeTokens;
  checkboxProps?: CheckboxProps;
  label: string;
}) {
  return (
    <XStack id="stack" alignItems="center">
      <Cb id={id} size={size} {...checkboxProps}>
        <Cb.Indicator>
          {/*<CheckIcon />*/}
        </Cb.Indicator>
      </Cb>

      <Label lineHeight={0} htmlFor={id} paddingLeft="$0.5">
        {label}
      </Label>
    </XStack>
  );
}
