/**
 * Entire zustand-lite no-boilerplate functionality is inspired by this recipe:
 * https://docs.pmnd.rs/zustand/guides/auto-generating-selectors and 3th party
 * zustand-x repository: https://github.com/udecode/zustand-x.
 **/
import { DevtoolsOptions, PersistOptions, devtools, persist } from 'zustand/middleware';
import { createStore as createVanillaStore } from 'zustand/vanilla';

import {
  AugmentedApiData,
  AugmentedGetters,
  AugmentedSetters,
  GettersBuilder,
  SettersBuilder,
  State,
  StoreApi,
  StoreApiPluginList,
} from '../types';
import { extendGetters } from './extendGetters';
import { extendSetters } from './extendSetters';
import { generateStateGet } from './generateStateGet';
import { generateStateSet } from './generateStateSet';
import { generateStateUse } from './generateStateUse';
import { restrictState } from './restrictState';

export function createStore<T extends State, Plugins extends StoreApiPluginList = []>(
  initialState: T,
  options?: {
    name?: string;
    plugins?: [...Plugins];
    middlewares?: {
      devtools?: true | DevtoolsOptions;
      persist?: true | PersistOptions<any>;
    };
  },
): StoreApi<AugmentedApiData<T, Plugins>, AugmentedGetters<Plugins>, AugmentedSetters<Plugins>> {
  const { name = 'zustand-lite', plugins = [], middlewares = {} } = options ?? {};

  // Merge state from plugins to be available for future use.
  let mergedState: any = initialState;
  plugins.forEach(plugin => {
    if (plugin.creates) {
      mergedState = { ...mergedState, ...plugin.creates() };
    }
  });

  // Apply supported middlewares.
  let initializer: any = () => mergedState;

  if (middlewares.devtools) {
    initializer = devtools(
      initializer,
      middlewares.devtools === true ? { name } : middlewares.devtools,
    );
  }

  if (middlewares.persist) {
    initializer = persist(
      initializer,
      middlewares.persist === true ? { name } : middlewares.persist,
    );
  }

  // Create a vanilla zustand store to wrap.
  const storeApi: any = createVanillaStore(initializer);

  // Create zustand-lite wrapper.
  let store: any = {
    api: storeApi,
    get: generateStateGet(storeApi),
    set: generateStateSet(storeApi, !!middlewares.devtools, name),
    use: generateStateUse(storeApi),
    extendGetters<Builder extends GettersBuilder<typeof mergedState>>(builder: Builder) {
      return extendGetters(builder, this);
    },
    extendSetters<Builder extends SettersBuilder<typeof mergedState>>(builder: Builder) {
      return extendSetters(builder, this);
    },
    restrictState<Key extends keyof T>(publicState: Key[] = []) {
      return restrictState(
        publicState,
        mergedState,
        this as StoreApi<
          AugmentedApiData<T, Plugins>,
          AugmentedGetters<Plugins>,
          AugmentedSetters<Plugins>
        >,
      );
    },
  };

  // Extend store getters and setters with plugins.
  plugins.forEach(plugin => {
    if (plugin.extends) {
      store = plugin.extends(store);
    }
  });

  return store;
}
