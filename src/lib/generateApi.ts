import { NamedSet } from 'zustand/middleware/devtools';
import { StoreApi } from 'zustand/vanilla';

import { State } from '../types';

function logFunctionName() {
  return new Error()?.stack?.split('\n')[3].trim().split(' ')[1].split('.')[1] ?? 'setState';
}

export function generateApi<T extends State>(
  api: StoreApi<T>,
  hasDevtools: boolean,
) {
  return {
    ...api,
    setState: (newState: T | ((state: T) => T), replace?: false, name?: string) => {
      const setState = api.setState as NamedSet<T>;
      setState(
        newState,
        replace,
        hasDevtools
          ? (name ?? { type: logFunctionName(), payload: newState })
          : undefined,
      );
    },
  };
}
