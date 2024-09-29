import { H4, View } from 'tamagui';
import { useEndApi } from '@end/data/web';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { hv2, Tile } from '@end/hexasphere';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PortalPath, useResponsive } from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';
import { getOrUndefined } from 'effect/Option';
import { execute } from '@end/data/core';
import { useParams } from 'react-router-dom';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import { Database } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { War } from '@end/wm/core';

function WarComponent({
  war,
  setTitle: st,
}: {
  war: War;
  setTitle?: (title?: string) => void;
}) {
  const { services } = useEndApi();
  const { warService } = services;
  const warStore = useSnapshot(warService.store);
  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1297) {
      return [[0, 160, 25], {}];
    }

    return [
      [0, 160, 25],
      {
        minWidth: 2000,
        width: '150%',
        marginLeft: -600,
      },
    ];
  }, [width]);
  const [menuOpen, setMenuOpen] = useState(true);
  let params = useParams();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!params.id) {
      return () => {};
    }

    Promise.all([
      war.planet.fetch(),
      execute(services.conquestService.getWar(params.id)).then((r) => r.json()),
    ]).then(([local, remote]) => {
      const tiles: Record<string, any> = JSON.parse(remote.war.state).context
        .tiles;
      const raised: Record<string, string> = JSON.parse(local.raised);
      const owners = new Map();
      warService.setLandAndWaterColors(local.waterColor, local.landColor);
      warService.setTiles(raised, tiles);
      setLoaded(true);

      const title = `The War of ${local.name}`;
      warService.setName(title);
      st?.(title);
    });

    services.conquestService.connectToWarLog(params.id).subscribe((r) => {
      // try {
      //   if (r) {
      //     const s = JSON.parse(
      //       JSON.parse(r).updateDescription.updatedFields.state
      //     );
      //
      //     const tile = getProxy().tiles.find((tile) => tile.id === tile1);
      //
      //     if (tile) {
      //       tile.troopCount = s.context.tiles[tile1].troopCount;
      //     }
      //   }
      // } catch (e) {}
    });

    return () => {
      warService.onTileSelection(null);
    };
  }, []);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);
  const { bp } = useResponsive(menuOpen);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <View style={bp(['pl-10 flex items-start', 'hidden', 'block'])}>
        <H4>{getOrUndefined(warStore.name)}</H4>
        {/*<Badge title={params.id} />*/}
      </View>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={cam}
      >
        <hv2.HexasphereV2 portalPath={PortalPath} />
        <OrbitControls />
      </Canvas>
    </View>
  );
}

const EnhancedWarComponent = compose(
  withDatabase,
  withObservables(
    ['warId'],
    ({
      database,
      warId,
    }: {
      database: Database;
      warId: string;
    }): { war: Observable<War> } => ({
      war: database.get<War>('wars').findAndObserve(warId),
    })
  ) as (arg0: unknown) => ComponentType
)(WarComponent);

export default function WarRouteComponent() {
  const params = useParams();

  return <EnhancedWarComponent warId={params.id} />;
}
