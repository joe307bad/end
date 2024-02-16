import React, { createContext, ReactNode, useContext } from 'react';
import { EndApi } from './data';

interface Context {
  EndApi: EndApi;
}

const EndApiContext = createContext<Context>({
  EndApi: new EndApi('http://192.168.50.163:3000/api'),
});

export function useEndApi() {
  return useContext(EndApiContext);
}

export function EndApiProvider({ children }: { children: ReactNode }) {
  return (
    <EndApiContext.Provider
      value={{ EndApi: new EndApi('http://192.168.50.163:3000/api') }}
    >
      {children}
    </EndApiContext.Provider>
  );
}
