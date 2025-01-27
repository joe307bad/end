import { Section } from 'tamagui';
import { Pressable, View } from 'react-native';
import { tw } from '../components';
import { CircleDot } from 'lucide-react-native';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';
import { useResponsive } from '../Layout';

export function ResponsiveTabs({
  children,
  menuOpen,
  setMenuOpen,
}: {
  children: ReactElement;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { bp } = useResponsive(menuOpen, 1000);
  return (
    <Section
      paddingTop={62}
      style={bp([
        'z-9 max-w-full',
        `relative w-full ${menuOpen ? 'h-[75%]' : ''}`,
        '',
        'absolute w-[500px] pb-5 right-[20px] w-[500px] h-full',
      ])}
    >
      <View style={tw`flex h-full`}>
        <View
          style={bp(['flex-1', `${menuOpen ? '' : 'hidden'}`, '', 'visible'])}
        >
          {children}
        </View>
        <Pressable
          onPress={() =>
            setMenuOpen((prev) => {
              return !prev;
            })
          }
          style={bp(['block text-white self-end', '', '', 'hidden'])}
        >
          <CircleDot color="white" size="$2" />
        </Pressable>
      </View>
    </Section>
  );
}
