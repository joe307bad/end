import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Context {
  getToken: () => Promise<string | null>;
  setToken: (jwt: string | undefined) => Promise<void>;
  deleteToken: () => Promise<void>;
}

const AuthContext = createContext<Context>({
  getToken: () => Promise.resolve(null),
  setToken: (jwt) => Promise.resolve(),
  deleteToken: () => Promise.resolve(),
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const getToken = useCallback(() => {
    return AsyncStorage.getItem('end_jwt');
  }, []);
  const setToken = useCallback((jwt: string | undefined) => {
    if (!jwt) {
      return Promise.resolve();
    }

    return AsyncStorage.setItem('end_jwt', jwt);
  }, []);
  const deleteToken = useCallback(() => {
    return AsyncStorage.removeItem('end_jwt');
  }, []);

  return (
    <AuthContext.Provider value={{ getToken, setToken, deleteToken }}>
      {children}
    </AuthContext.Provider>
  );
}
