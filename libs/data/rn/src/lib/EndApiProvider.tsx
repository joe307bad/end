import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { servicesFactory } from '@end/data/core';
import { useAuth } from '@end/auth';
import { adapter } from '@end/wm/rn';
import { Effect, Option as O, pipe } from 'effect';

function useServices(getToken: () => Promise<string | null>, apiUrl: string) {
  return useMemo(() => {
    return servicesFactory(
      () =>
        pipe(
          Effect.promise(() => getToken()),
          Effect.map((result) => O.fromNullable(result))
        ),
      adapter,
      apiUrl,
      ''
    );
  }, []);
}

interface Context {
  services: ReturnType<typeof useServices>;
}

const EndApiContext = createContext<Context>({} as Context);

export function useEndApi() {
  return useContext(EndApiContext);
}

export function EndApiProvider({
  children,
  baseUrl: burl,
}: {
  children: ReactNode;
  baseUrl?: string;
}) {
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const { getToken } = useAuth();
  const services = useServices(getToken, baseUrl);

  return (
    <EndApiContext.Provider value={{ services }}>
      {children}
    </EndApiContext.Provider>
  );
}
