import { Pressable, View } from 'react-native';
import { Popover, Spinner, Text, XStack, YStack } from 'tamagui';
// import { ArrowRight } from '@tamagui/lucide-icons';
import React from 'react';

export function ActivityArrow({
  message,
  loading,
  onPress,
  open,
}: {
  loading: boolean;
  onPress: () => void;
  open: boolean;
  message: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <XStack alignItems="center">
        <Popover size="$5" allowFlip open={open}>
          <Popover.Trigger asChild>
            {loading ? (
              <Spinner size="small" />
            ) : (
              <Pressable onPress={onPress}>
                {/*<ArrowRight color="white" size="$1" />*/}
              </Pressable>
            )}
          </Popover.Trigger>

          <Popover.Content
            borderWidth={1}
            // borderColor="red"
            enterStyle={{ y: -10, opacity: 0 }}
            exitStyle={{ y: -10, opacity: 0 }}
            elevate
            padding="$0.75"
            animation={[
              'fast',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
          >
            <Popover.Arrow size="$1.5" borderWidth={1} borderColor="red" />
            <YStack gap="$3">
              <XStack gap="$3">
                <Text fontSize={13} maxWidth={500}>
                  {message}
                </Text>
              </XStack>
            </YStack>
          </Popover.Content>
        </Popover>
      </XStack>
    </View>
  );
}
