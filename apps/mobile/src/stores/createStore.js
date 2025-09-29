// Simple Zustand store creation without complex imports
import React from 'react';

export function createStore(createState) {
  let state;
  let listeners = new Set();

  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;

    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = replace ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const destroy = () => {
    listeners.clear();
  };

  const api = { setState, getState, subscribe, destroy };
  state = createState(setState, getState, api);

  return api;
}

export function create(createState) {
  const api = createStore(createState);

  const useBoundStore = (selector) => {
    const [, forceUpdate] = React.useReducer((c) => c + 1, 0);

    React.useEffect(() => {
      const listener = () => forceUpdate();
      const unsubscribe = api.subscribe(listener);
      return unsubscribe;
    }, []);

    const state = api.getState();
    return selector ? selector(state) : state;
  };

  Object.assign(useBoundStore, api);

  return useBoundStore;
}

// Dummy middleware functions that just return the config as-is
export const devtools = (config) => config;
export const persist = (config) => config;
export const createJSONStorage = () => ({
  getItem: async (name) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (name) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(name);
    } catch {
      // Ignore errors
    }
  },
});