import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { StoreApi } from 'zustand';

import { EqualityChecker, GetRecord, State } from '../types';

export function generateUse<T extends State>(api: StoreApi<T>) {
  const getters: GetRecord<T> = {} as GetRecord<T>;

  Object.keys(api.getState()).forEach(key => {
    getters[key as keyof T] = (equalityFn: EqualityChecker<T[keyof T]> = shallow) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useStoreWithEqualityFn(api, (state: T) => state[key as keyof T], equalityFn);
    };
  });

  return getters;
}
