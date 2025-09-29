const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Force zustand to use CommonJS version instead of ESM
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};

  // Redirect ESM versions to CommonJS
  config.resolve.alias['zustand/esm'] = require.resolve('zustand');
  config.resolve.alias['zustand/esm/middleware'] = require.resolve('zustand/middleware');
  config.resolve.alias['zustand/esm/shallow'] = require.resolve('zustand/shallow');

  // Also handle import.meta globally
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Replace import.meta.env with process.env
  config.plugins = config.plugins || [];
  config.plugins.push(
    new (require('webpack').DefinePlugin)({
      'import.meta.env': JSON.stringify(process.env),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development'),
    })
  );

  return config;
};