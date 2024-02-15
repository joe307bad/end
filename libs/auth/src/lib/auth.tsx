import React, { createContext, ReactNode, useCallback, useContext } from 'react';

interface Context {
  getToken: () => string | null;
  setToken: (jwt: string) => void;
}

const AuthContext = createContext<Context>({
  getToken: () => '',
  setToken: (jwt) => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const getToken = useCallback(() => {
    return localStorage.getItem('end_jwt');
  }, []);
  const setToken = useCallback((jwt: string) => {
    return localStorage.setItem('end_jwt', jwt);
  }, []);

  return (
    <AuthContext.Provider value={{ getToken, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}
