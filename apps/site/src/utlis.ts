import { useEffect, useState } from 'react';

export const usePersistentState = (key: string, defaultValue: any) => {
  const [state, setState] = useState(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const value = JSON.parse(localStorage.getItem(key) ?? 'null');
      setState(value === null ? defaultValue : value);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
