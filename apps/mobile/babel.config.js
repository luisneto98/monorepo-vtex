module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@shared': '../../packages/shared/src',
            // Force CommonJS version of zustand
            'zustand/esm': 'zustand',
            'zustand/esm/middleware': 'zustand/middleware',
            'zustand/esm/shallow': 'zustand/shallow'
          }
        }
      ]
    ]
  };
};