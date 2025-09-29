const React = require('react');

// Create a mock React Native implementation for testing
const ReactNative = jest.createMockFromModule('react-native');

// Override Platform with working mock
ReactNative.Platform = {
  OS: 'ios',
  Version: 14,
  select: jest.fn((obj) => obj.ios || obj.default),
  isTV: false,
  isTVOS: false,
};

// Mock View and Text components
ReactNative.View = 'View';
ReactNative.Text = 'Text';
ReactNative.ScrollView = 'ScrollView';
ReactNative.FlatList = 'FlatList';
ReactNative.TouchableOpacity = 'TouchableOpacity';
ReactNative.Image = 'Image';
ReactNative.RefreshControl = 'RefreshControl';
ReactNative.ActivityIndicator = 'ActivityIndicator';
ReactNative.SafeAreaView = 'SafeAreaView';
ReactNative.StatusBar = 'StatusBar';
ReactNative.Button = 'Button';
ReactNative.TextInput = 'TextInput';
ReactNative.KeyboardAvoidingView = 'KeyboardAvoidingView';
ReactNative.Modal = 'Modal';
ReactNative.Switch = 'Switch';
ReactNative.Alert = {
  alert: jest.fn(),
};
ReactNative.Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
ReactNative.StyleSheet = {
  create: (styles) => styles,
  flatten: (styles) => styles,
  compose: (style1, style2) => [style1, style2].filter(Boolean),
  absoluteFillObject: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};
ReactNative.Animated = {
  View: 'Animated.View',
  Text: 'Animated.Text',
  ScrollView: 'Animated.ScrollView',
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(),
  })),
  timing: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  parallel: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  createAnimatedComponent: jest.fn((Component) => Component),
};

module.exports = ReactNative;