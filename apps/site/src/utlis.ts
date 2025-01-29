import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const usePersistentState = (
  key: string,
  defaultValue: any
): [boolean | null, Dispatch<SetStateAction<boolean | null>>] => {
  const [state, setState] = useState<boolean | null>(null);

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
