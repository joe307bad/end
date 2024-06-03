import React, { createContext, ReactNode, useContext } from 'react';
import { EndApi } from './data';
import { Database } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import ConquestService from './conquest-service';
import { useAuth } from '@end/auth';
import { syncFactory } from '@end/wm/core';

interface Context {
  EndApi: EndApi;
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
  const database = useDatabase();
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const { getToken } = useAuth();
  return (
    <EndApiContext.Provider
      value={{
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
