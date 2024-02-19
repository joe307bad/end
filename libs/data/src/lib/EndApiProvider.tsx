import React, { createContext, ReactNode, useContext } from 'react';
import { EndApi } from './data';

interface Context {
  EndApi: EndApi;
}

const EndApiContext = createContext<Context>({
  EndApi: new EndApi('http://localhost:3000/api'),
});

export function useEndApi() {
  return useContext(EndApiContext);
}

export function EndApiProvider({
  children,
  baseUrl,
}: {
  children: ReactNode;
  baseUrl?: string;
}) {
  return (
    <EndApiContext.Provider
      value={{ EndApi: new EndApi(baseUrl ?? 'http://localhost:3000/api') }}
    >
      {children}
    </EndApiContext.Provider>
  );
}
