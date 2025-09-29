// Global setup for testing environment
// Only load in test environment
if (typeof jest !== 'undefined') {
  require('@testing-library/react-native/extend-expect');
}

// Fix for React 19 compatibility
global.IS_REACT_ACT_ENVIRONMENT = true;

// Suppress specific warnings in test environment
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
     args[0].includes('Warning: unmountComponentAtNode') ||
     args[0].includes('ViewConfigIgnore') ||
     args[0].includes('identifier expected in type parameter'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated: `useNativeDriver`') ||
     args[0].includes('ViewPropTypes'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Setup default environment for tests
beforeEach(() => {
  jest.clearAllMocks();
});