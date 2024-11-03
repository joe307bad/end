import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { servicesFactory } from '@end/data/core';
import { useAuth } from '@end/auth';
import { adapter } from '@end/wm/web';
import { Option as O, pipe } from 'effect';
import { Option } from 'effect/Option';
import { Effect } from 'effect';

function useServices(
  getToken: () => Effect.Effect<Option<string>>,
  apiUrl: string,
  webSocketUrl: string
) {
  return useMemo(() => {
    return servicesFactory(getToken, adapter, apiUrl, webSocketUrl);
  }, []);
}

interface Context {
  services: ReturnType<typeof servicesFactory>;
}

const EndApiContext = createContext<Context>({} as Context);

export function useEndApi() {
  return useContext(EndApiContext);
}

export function EndApiProvider({
  children,
  baseUrl: burl,
  webSocketUrl: wsurl,
}: {
  children: ReactNode;
  baseUrl?: string;
  webSocketUrl?: string;
}) {
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const webSocketUrl = wsurl ?? 'localhost:3000';
  const { getToken } = useAuth();
  const services = useServices(
    () =>
      pipe(
        Effect.promise(() => getToken()),
        Effect.map((result) => O.fromNullable(result))
      ),
    baseUrl,
    webSocketUrl
  );

  return (
    <EndApiContext.Provider value={{ services }}>
      {children}
    </EndApiContext.Provider>
  );
}
