import { StoreApi } from 'zustand/vanilla';

import { GetRecord, State } from '../types';

export function generateGet<T extends State>(api: StoreApi<T>) {
  const getters: GetRecord<T> = {} as GetRecord<T>;

  const initialState = api.getState();

  Object.keys(initialState).forEach(key => {
    getters[key as keyof T] = () => api.getState()[key as keyof T];
  });

  Object.getOwnPropertySymbols(initialState).forEach(symbol => {
    getters[symbol as keyof T] = () => api.getState()[symbol as keyof T];
  });

  return getters;
}
