import { H2, H4, View } from 'tamagui';
import { useEndApi } from '@end/data/web';
import React, { ComponentType, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { hv2 } from '@end/hexasphere';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PortalPath, GameTabsV2 } from '@end/components';
import { OrbitControls } from '@react-three/drei';
import { useWindowDimensions } from 'react-native';
import { pipe } from 'effect';
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
  const { warService, conquestService, syncService } = services;
  const warStore = useSnapshot(warService.store);
  const { width } = useWindowDimensions();

  const [cameraResponsiveness, responsiveness] = useMemo(() => {
    if (width < 835) {
      return [[0, 300, 25], {}];
    }

    if (width < 1000) {
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

  const [_selectedTile, setSelectedTile] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(true);
  let params = useParams();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params.id) {
      return () => {};
    }

    Promise.all([
      war.planet.fetch(),
      execute(services.conquestService.getWar(params.id)),
    ]).then(([local, remote]) => {
      const title = `The War of ${local.name}`;
      warService.begin(local, remote, params, title);
      st?.(title);
      setLoaded(true);
    });

    const unsubscribe = services.conquestService.connectToWarLog(
      params.id,
      (r) =>
        execute(
          pipe(
            services.warService.handleWarLogEntry(r)
          )
        )
    );

    return () => {
      warService.onTileSelection(null).then(async (settingPortal) => {
        if (settingPortal) {
          await execute(conquestService.setPortal());
        }
      });
      warService.setActiveBattle(undefined);
      warService.store.battles = [];
      warService.store.deployments = [];
      warService.store.active = true;
      warService.resetTiles();
      unsubscribe();
    };
  }, []);

  const cam = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45);
    cam.position.set(0, 0, 160);

    return cam;
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
      <H2 paddingLeft="$1">{getOrUndefined(warStore.name)}</H2>
      <Canvas
        style={{
          flex: 1,
          ...responsiveness,
        }}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 160] }}
      >
        <hv2.HexasphereV2 portalPath={PortalPath} />
        <OrbitControls />
      </Canvas>
      <GameTabsV2
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
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
