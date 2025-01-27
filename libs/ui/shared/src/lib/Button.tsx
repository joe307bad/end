import { Button, ButtonProps, SizeTokens, Spinner, Text } from 'tamagui';
import React, { ReactNode } from 'react';

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
  height,
  withIcon,
  ...rest
}: {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  height?: SizeTokens;
  withIcon?: boolean;
} & ButtonProps) {
  return (
    <Button
      onPress={onPress}
      borderRadius={0}
      {...(!height ? {} : { height })}
      width={withIcon ? undefined : '100%'}
      padding={0}
      disabled={disabled}
      icon={loading ? () => <Spinner size="small" /> : undefined}
      {...rest}
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
