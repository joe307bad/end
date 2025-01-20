import { Button, SizeTokens, Spinner, Text } from 'tamagui';
import React, { ReactNode } from 'react';

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
  height,
  withIcon,
}: {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  height?: SizeTokens;
  withIcon?: boolean;
}) {
  return (
    <Button
      onPress={onPress}
      borderRadius={0}
      {...(!height ? {} : { height })}
      width={withIcon ? undefined : '100%'}
      padding={0}
      disabled={disabled}
      icon={loading ? () => <Spinner size="small" /> : undefined}
    >
      {withIcon ? (
        children
      ) : (
        // @ts-ignore
        <Text>{children}</Text>
      )}
    </Button>
  );
}
