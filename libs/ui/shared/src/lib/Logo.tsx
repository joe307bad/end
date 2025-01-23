import { H1, View, XStack, Text } from 'tamagui';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { shuffle } from 'remeda';
import Hexagon from '@mui/icons-material/Hexagon';

const c = shuffle([
  '#FFD1DC',
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
  '#FF6347',
  '#B0E0E6',
  '#FF00FF',
  '#FFB6C1',
  '#32CD32',
  '#C3B1E1',
  '#FFFF00',
]);

export function Logo({ }: { Hexagon: ComponentType<any> }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [bgColorIndex, setBgColorIndex] = useState(1);
  const [colorIndex2, setColorIndex2] = useState(2);

  const colors = useMemo(() => shuffle(c), []);

  useEffect(() => {
    setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    setColorIndex2((prevIndex) => (prevIndex + 1) % colors.length);

    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
      setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
      setColorIndex2((prevIndex) => (prevIndex + 1) % colors.length);
    }, 6000); // Change color every 2 seconds

    return () => clearInterval(interval);
  }, []);
  return (
    <XStack
      id="logo"
      alignItems="center"
      justifyContent="center"
      padding={30}
      borderColor={colors[colorIndex2]}
      gap="$0.5"
      // height={75}
      // width={182}
      // backgroundColor={colors[bgColorIndex]}
    >
      <View marginLeft={-5}>
        <Text
          alignItems="center"
          display="flex"
          height={60}
          fontSize="53px"
          paddingRight={8}
        >
          <Hexagon
            fontSize="inherit"
            style={{
              stroke: colors[bgColorIndex],
              strokeWidth: '2px',
              fill: 'none',
            }}
          />
        </Text>
      </View>
      <H1
        textAlign="center"
        fontSize="$12"
        letterSpacing="$1"
        height={49}
        margin={0}
        color={colors[bgColorIndex]}
      >
        end
      </H1>
    </XStack>
  );
}
