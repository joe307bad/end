import { H1, View, XStack } from 'tamagui';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { shuffle } from 'remeda';

const c = shuffle([
  '#FFD1DC',
  'black',
  '#39FF14',
  '#AEC6CF',
  '#FF1493',
  '#77DD77',
  '#00FFFF',
  '#FDFD96',
  '#FF4500',
  '#CBAACB',
  '#7FFF00',
  '#FFB347',
  '#8A2BE2',
  '#FFDAB9',
  'black',
  '#FF6347',
  '#B0E0E6',
  '#FF00FF',
  '#FFB6C1',
  '#32CD32',
  '#C3B1E1',
  '#FFFF00',
]);

export function Logo({ Hexagon }: { Hexagon: ComponentType<any> }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [bgColorIndex, setBgColorIndex] = useState(1);
  const [colorIndex2, setColorIndex2] = useState(2);

  const colors = useMemo(() => shuffle(c), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
      setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
      setColorIndex2((prevIndex) => (prevIndex + 1) % colors.length);
    }, 2000); // Change color every 2 seconds

    return () => clearInterval(interval);
  }, []);
  return (
    <XStack
      id="logo"
      alignItems="center"
      justifyContent="center"
      padding={30}
      borderWidth={8}
      borderColor={colors[colorIndex2]}
      gap="$0.5"
      // height={75}
      // width={182}
      // backgroundColor={colors[bgColorIndex]}
    >
      <View marginLeft={-5}>
        <Hexagon strokeWidth={2} color={colors[bgColorIndex]} size={50} />
      </View>
      <H1
        textAlign="center"
        fontSize="$12"
        letterSpacing="$1"
        height={49}
        margin={0}
        color={colors[colorIndex]}
      >
        end
      </H1>
    </XStack>
  );
}
