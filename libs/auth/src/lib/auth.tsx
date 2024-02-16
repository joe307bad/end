import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from 'react';

interface Context {
  getToken: () => string | null;
  setToken: (jwt: string | undefined) => void;
  deleteToken: () => void;
}

const AuthContext = createContext<Context>({
  getToken: () => '',
  setToken: (jwt) => {},
  deleteToken: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const getToken = useCallback(() => {
    return localStorage.getItem('end_jwt');
  }, []);
  const setToken = useCallback((jwt: string | undefined) => {
    return jwt && localStorage.setItem('end_jwt', jwt);
  }, []);
  const deleteToken = useCallback(() => {
    return localStorage.removeItem('end_jwt');
  }, []);

  return (
    <AuthContext.Provider value={{ getToken, setToken, deleteToken }}>
      {children}
    </AuthContext.Provider>
  );
}
