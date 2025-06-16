import { StoreApi as StoreApiLib } from 'zustand';

export type State = Record<string | symbol, unknown>;
export type Empty = Record<string, never>;
export type Default = Record<string | symbol, any>;
export type EqualityChecker<T> = (state: T, newState: T) => boolean;

export type StoreApiGet<T extends State, Getters> = Required<GetRecord<T>> & Getters;
export type StoreApiUse<T extends State, Getters> = Required<UseRecord<T>> & Getters;
export type StoreApiSet<T extends State, Setters> = Required<SetRecord<T>> & Setters;

export type StoreApiEncapsulated<T extends State = Empty, Getters = Default, Setters = Default> = {
  api: StoreApiLib<T>;
  get: StoreApiGet<T, Getters>;
  set: StoreApiSet<T, Setters>;
  use: StoreApiUse<T, Getters>;
};

export type StoreApi<T extends State = Empty, Getters = Default, Setters = Default> = {
  api: StoreApiLib<T>;
  get: StoreApiGet<T, Getters>;
  set: StoreApiSet<T, Setters>;
  use: StoreApiUse<T, Getters>;

  extendGetters<Builder extends GettersBuilder<T, Getters, Setters>>(
    builder: Builder,
  ): StoreApi<T, Getters & ReturnType<Builder>, Setters>;

  extendSetters<Builder extends SettersBuilder<T, Getters, Setters>>(
    builder: Builder,
  ): StoreApi<T, Getters, Setters & ReturnType<Builder>>;

  restrictState(): StoreApiEncapsulated<T, Getters, Setters>;
  restrictState<Key extends keyof T>(
    publicState: Key[],
  ): StoreApiEncapsulated<Pick<T, Key>, Getters, Setters>;
};

export type GettersBuilder<T extends State, Getters = Default, Setters = Default> = (args: {
  api: StoreApiLib<T>;
  get: StoreApiGet<T, Getters>;
  set: StoreApiSet<T, Setters>;
}) => Record<string, (...args: any[]) => {} | null>;

export type SettersBuilder<T extends State, Getters = Default, Setters = Default> = (args: {
  api: StoreApiLib<T>;
  get: StoreApiGet<T, Getters>;
  set: StoreApiSet<T, Setters>;
}) => Record<string, (...args: any[]) => void>;

export type GetRecord<O extends Record<string, any>> = {
  [K in keyof O]: () => O[K];
};

export type UseRecord<O extends Record<string, any>> = {
  [K in keyof O]: (equalityFn?: EqualityChecker<O[K]>) => O[K];
};

export type SetRecord<O extends Record<string, any>> = {
  [K in keyof O]: (value: O[K]) => void;
};

export type StoreApiPlugin<NewApiData extends State, NewGetters, NewSetters> = {
  creates?: () => NewApiData;
  extends?: (
    store: StoreApi<NewApiData, NewGetters, NewSetters>,
  ) => StoreApi<NewApiData, NewGetters, NewSetters>;
};

export type StoreApiPluginList = StoreApiPlugin<any, any, any>[];

export type AugmentedApiData<T, Plugins extends StoreApiPluginList> = T &
  UnionToIntersection<ExtractPluginTypes<Plugins, 'create'>[number]>;

export type AugmentedGetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
  ExtractPluginTypes<Plugins, 'extend'>[number]['getters']
>;

export type AugmentedSetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
  ExtractPluginTypes<Plugins, 'extend'>[number]['setters']
>;

type ExtractPluginTypes<Plugins extends StoreApiPluginList, Key extends 'create' | 'extend'> = {
  [K in keyof Plugins]: Plugins[K] extends StoreApiPlugin<infer S, infer G, infer A>
    ? Key extends 'create'
      ? S
      : Key extends 'extend'
        ? { getters: G; setters: A }
        : never
    : never;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;
