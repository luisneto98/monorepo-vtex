// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const View = require('react-native').View;

  return {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    FlatList: View,
    RectButton: View,
    BaseButton: View,
    TapGestureHandler: View,
    PanGestureHandler: View,
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableWithoutFeedback: View,
    TextInput: View,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'vtexevents://'),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: This mock is not needed with current React Native version

// Mock Platform to ensure consistent test environment
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
    Version: 14,
  };
  return Platform;
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  enableFreeze: jest.fn(),
  ScreenContainer: ({ children }) => children,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
        environment: 'test',
      },
    },
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getNotificationChannelsAsync: jest.fn(),
  deleteNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));