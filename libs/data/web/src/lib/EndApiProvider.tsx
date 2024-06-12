import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { EndApi, servicesFactory, execute } from '@end/data/core';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useAuth } from '@end/auth';
import { syncFactory } from '@end/wm/core';
import { adapter } from '@end/wm/web';

function useServices(getToken: () => Promise<string | null>) {
  return useMemo(() => {
    return servicesFactory(getToken, adapter);
  }, []);
}

interface Context {
  EndApi: EndApi;
  services: ReturnType<typeof useServices>;
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
  const services = useServices(getToken);

  useEffect(() => {
    execute(services.syncService.sync()).then(console.log);
  }, []);

  return (
    <EndApiContext.Provider
      value={{
        services,
        EndApi: new EndApi(
          baseUrl,
          database,
          {} as any, //new ConquestService(baseUrl, getToken),
          sync,
          getToken
        ),
      }}
    >
      {children}
    </EndApiContext.Provider>
  );
}
