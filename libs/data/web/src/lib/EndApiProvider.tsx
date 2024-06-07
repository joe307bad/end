import React, { createContext, ReactNode, useContext } from 'react';
import { EndApi, services } from '@end/data/core';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import ConquestService from '../../../core/src/lib/conquest-service';
import { useAuth } from 'libs/auth/src';
import { syncFactory } from 'libs/wm/core/src';

function useServices() {
  return services;
}
interface Context {
  EndApi: EndApi;
  services: ReturnType<typeof useServices>
}

const EndApiContext = createContext<Context>({} as Context);

export function useEndApi() {
  return useContext(EndApiContext);
}


export function EndApiProvider({
  children,
  baseUrl: burl,
  sync,
}: {
  children: ReactNode;
  baseUrl?: string;
  sync: ReturnType<typeof syncFactory>;
}) {
  const services = useServices();
  const database = useDatabase();
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const { getToken } = useAuth();
  return (
    <EndApiContext.Provider
      value={{
        services,
        EndApi: new EndApi(
          baseUrl,
          database,
          new ConquestService(baseUrl, getToken),
          sync,
          getToken
        ),
      }}
    >
      {children}
    </EndApiContext.Provider>
  );
}
