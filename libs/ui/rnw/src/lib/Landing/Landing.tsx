import * as Typography from '../Typography';
import { View } from 'react-native';
import Styles from './Landing.module.scss';
import { Input, XStack, Button, YStack } from 'tamagui';

export function Landing() {
  return (
    <View id={Styles.landing}>
      <YStack space="$2">
        <View id={Styles.h1Container}>
          <Typography.H1>end</Typography.H1>
        </View>
        <XStack alignItems="center" space="$2">
          <Input borderRadius={0} flex={1} />
          <Input borderRadius={0} flex={1} />
          <Button borderRadius={0}>Login</Button>
        </XStack>
      </YStack>
    </View>
  );
}
