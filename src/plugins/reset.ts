import { StoreApiPlugin } from '../types';

type Setters = {
  reset: () => void;
};

export const reset: StoreApiPlugin<{}, {}, Setters> = {
  extends: store => {
    return store.extendSetters(({ api }) => ({
      reset: () => {
        const initialState = api.getInitialState?.() ?? {};
        api.setState(() => initialState, true);
      },
    }));
  },
};
