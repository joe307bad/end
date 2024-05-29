import React, { createContext, ReactNode, useContext } from 'react';
import { EndApi } from './data';
import { Database } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import ConquestService from './conquest-service';
import { useAuth } from '@end/auth';

interface Context {
  EndApi: EndApi;
}

const EndApiContext = createContext<Context>({
  EndApi: new EndApi('http://localhost:3000/api', null as any, null as any),
});

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
  const database = useDatabase();
  const baseUrl = burl ?? 'http://localhost:3000/api';
  const { getToken } = useAuth();
  return (
    <EndApiContext.Provider
      value={{
        EndApi: new EndApi(baseUrl, database, new ConquestService(baseUrl, getToken)),
      }}
    >
      {children}
    </EndApiContext.Provider>
  );
}
