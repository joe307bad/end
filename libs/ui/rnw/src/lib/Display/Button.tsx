import { Button, Spinner, Text } from 'tamagui';
import React, { ReactNode } from 'react';

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      onPress={onPress}
      borderRadius={0}
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
