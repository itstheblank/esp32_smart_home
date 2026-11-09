(globalThis as any).__DEV__ = true;

import React from 'react';
import { vi } from 'vitest';

vi.mock('@expo-google-fonts/plus-jakarta-sans', () => ({
  useFonts: () => [true],
  PlusJakartaSans_400Regular: 'PlusJakartaSans_400Regular',
  PlusJakartaSans_500Medium: 'PlusJakartaSans_500Medium',
  PlusJakartaSans_600SemiBold: 'PlusJakartaSans_600SemiBold',
  PlusJakartaSans_700Bold: 'PlusJakartaSans_700Bold',
  PlusJakartaSans_800ExtraBold: 'PlusJakartaSans_800ExtraBold',
}));

vi.mock('expo-font', () => ({
  useFonts: () => [true],
  loadAsync: vi.fn().mockResolvedValue(true),
  isLoaded: vi.fn().mockReturnValue(true),
}));

const mockBox = (name: string) => {
  const Comp = ({ children }: any) => React.createElement('div', { 'data-rn': name }, children);
  Comp.displayName = name;
  return Comp;
};

vi.mock('react-native-svg', () => ({
  default: ({ children }: any) => React.createElement('svg', null, children),
  Svg: ({ children }: any) => React.createElement('svg', null, children),
  Path: () => React.createElement('path'),
  Rect: () => React.createElement('rect'),
  Circle: () => React.createElement('circle'),
  Line: () => React.createElement('line'),
  Polyline: () => React.createElement('polyline'),
  Defs: ({ children }: any) => React.createElement('defs', null, children),
  LinearGradient: ({ children }: any) => React.createElement('linearGradient', null, children),
  Stop: () => React.createElement('stop'),
}));

vi.mock('react-native', () => ({
  View: mockBox('View'),
  Text: ({ children }: any) => React.createElement('span', null, children),
  TouchableOpacity: mockBox('TouchableOpacity'),
  TouchableWithoutFeedback: mockBox('TouchableWithoutFeedback'),
  ScrollView: mockBox('ScrollView'),
  TextInput: () => React.createElement('input'),
  Switch: () => React.createElement('input', { type: 'checkbox' }),
  ActivityIndicator: mockBox('ActivityIndicator'),
  Modal: ({ visible, children }: any) =>
    visible ? React.createElement('div', null, children) : null,
  FlatList: ({ data = [], renderItem, ListEmptyComponent }: any) =>
    data.length === 0
      ? (ListEmptyComponent ?? null)
      : React.createElement(
          'div',
          null,
          data.map((item: any, index: number) =>
            React.createElement(
              React.Fragment,
              { key: item?.id ?? index },
              renderItem({ item, index })
            )
          )
        ),
  Platform: {
    OS: 'web',
    select: (obj: any) => obj?.web ?? obj?.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Animated: {
    Value: class {
      constructor(public val: number) {}
      setValue(v: number) {
        this.val = v;
      }
      interpolate(config: { outputRange: any[] }) {
        return config.outputRange[0];
      }
    },
    timing: () => ({ start: (cb?: any) => cb && cb() }),
    spring: () => ({ start: (cb?: any) => cb && cb() }),
    sequence: () => ({ start: (cb?: any) => cb && cb() }),
    loop: () => ({ start: () => {}, stop: () => {} }),
    View: mockBox('Animated.View'),
  },
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  SafeAreaView: mockBox('SafeAreaView'),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const memoryStore = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, val: string) => {
      memoryStore.set(key, String(val));
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
    }),
  },
}));
