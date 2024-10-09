import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { servicesFactory } from '@end/data/core';
import { useAuth } from '@end/auth';
import { adapter } from '@end/wm/web';

function useServices(
  getToken: () => Promise<string | null>,
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
  webSocketUrl: wsurl
}: {
  children: ReactNode;
  baseUrl?: string;
  webSocketUrl?: string;
}) {
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const webSocketUrl = wsurl ?? 'localhost:3000';
  const { getToken } = useAuth();
  const services = useServices(getToken, baseUrl, webSocketUrl);

  return (
    <EndApiContext.Provider value={{ services }}>
      {children}
    </EndApiContext.Provider>
  );
}
