import { NamedSet } from 'zustand/middleware/devtools';
import { StoreApi } from 'zustand/vanilla';

import { SetRecord, State } from '../types';

export function generateStateSet<T extends State>(
  api: StoreApi<T>,
  hasDevtools: boolean,
  storeName: string
): SetRecord<T> {
  const setters: SetRecord<T> = {} as SetRecord<T>;

  Object.keys(api.getState()).forEach(key => {
    setters[key as keyof T] = (value: any) => {
      if (api.getState()[key] === value) {
        return;
      }

      const setState = api.setState as NamedSet<T>;
      setState(
        state => ({
          ...state,
          [key]: value,
        }),
        false,
        hasDevtools ? { type: `${storeName}/${key}`, payload: { [key]: value } } : undefined,
      );
    };
  });

  return setters;
}
