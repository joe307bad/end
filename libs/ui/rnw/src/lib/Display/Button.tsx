import { Button, SizeTokens, Spinner, Text } from 'tamagui';
import React, { ReactNode } from 'react';

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
  height,
}: {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  height?: SizeTokens;
}) {
  return (
    <Button
      onPress={onPress}
      borderRadius={0}
      {...(!height ? {} : { height })}
      width="100%"
      padding={0}
      disabled={disabled}
      icon={
        loading
          ? () => (
              <Spinner
                size="small"
                style={{ position: 'absolute', left: 10 }}
              />
            )
          : undefined
      }
    >
      <Text style={{ position: 'absolute' }}>{children}</Text>
    </Button>
  );
}
