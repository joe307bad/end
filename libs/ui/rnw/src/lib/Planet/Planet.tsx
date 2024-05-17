import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  H5,
  Input,
  Section,
  Separator,
  SizableText,
  Tabs,
  TabsContentProps,
  Text,
  View,
} from 'tamagui';
import { Slider } from '@miblanchard/react-native-slider';
import { PrimaryButton } from '../Display';
import { getPointInBetweenByPerc, PortalPath, tw } from '../components';
import {
  Coords,
  Hexasphere,
  RenderedTile,
  THexasphere,
  Tile,
} from '@end/hexasphere';
import { useResponsive } from '../Layout';
import { MenuSquare, CircleDot } from '@tamagui/lucide-icons';
import { faker } from '@faker-js/faker';
import { TabsContent } from '../Tabs';

export function Planet({
  children,
  setReset,
  reset,
  tiles,
  hexasphere,
}: {
  setReset(r: number): void;
  reset: number;
  hexasphere: THexasphere;
  tiles: RenderedTile[];
  children: (
    hexasphere: JSX.Element,
    controls: JSX.Element,
    footer: JSX.Element
  ) => ReactNode;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [menuOpen, toggleMenu] = useState<boolean>(false);
  const { bp } = useResponsive(menuOpen, 1297);

  const [from, to] = useMemo(() => {
    const from = faker.number.int({ min: 0, max: 161 });
    var to = faker.number.int({ min: 0, max: 161 });

    while (from === to) {
      to = faker.number.int({ min: 0, max: 161 });
    }

    return [from, to];
  }, []);

  const [selectedTile, setSelectedTileState] = useState<{
    x: number;
    y: number;
    z: number;
  }>();

  const setSelectedTile = useCallback((id: Coords) => {
    setSelectedTileState(
      (prevId: { x: number; y: number; z: number } | undefined) => {
        const { x, y, z } = prevId ?? {};
        const { x: x1, y: y1, z: z1 } = id ?? {};
        return JSON.stringify({ x, y, z }) ===
          JSON.stringify({ x: x1, y: y1, z: z1 })
          ? undefined
          : id;
      }
    );
  }, [setSelectedTileState]);

  return (
    <Section style={tw`h-full w-full relative overflow-hidden`}>
      {children(
        <></>,
        <></>,
        <PrimaryButton onPress={() => setReset(Math.random())}>
          New Planet
        </PrimaryButton>
      )}
    </Section>
  );
}
