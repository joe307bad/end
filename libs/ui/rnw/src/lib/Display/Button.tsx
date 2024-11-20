import { Button, SizeTokens, Spinner, Text } from 'tamagui';
import React, { ReactElement, ReactNode } from 'react';

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
      width={withIcon ? undefined : "100%"}
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
      {withIcon ? (
        children
      ) : (
        <Text style={{ position: 'absolute' }}>{children}</Text>
      )}
    </Button>
  );
}
