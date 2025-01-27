import { useEffect, useState } from 'react';

export const usePersistentState = (key: string, defaultValue: any) => {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(key) ?? null) || defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
