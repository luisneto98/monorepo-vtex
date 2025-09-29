const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Exclude test files and jest setup from bundling
config.resolver.blacklistRE = /.*\/(tests?|__tests?__|.*\.(test|spec))\.(ts|tsx|js|jsx)$/;
config.resolver.blockList = [
  /.*\/(tests?|__tests?__|.*\.(test|spec))\.(ts|tsx|js|jsx)$/,
  /.*\/jest-setup.*\.js$/,
  /.*\/__mocks__\/.*/,
  /.*\.test\.(ts|tsx|js|jsx)$/,
  /.*\.spec\.(ts|tsx|js|jsx)$/,
];

// Force CommonJS version of zustand instead of ESM
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    // Replace ESM imports with CJS versions
    if (moduleName === 'zustand') {
      return context.resolveRequest(context, 'zustand/vanilla', platform);
    }
    if (moduleName.includes('/esm/')) {
      const cjsModule = moduleName.replace('/esm/', '/');
      return context.resolveRequest(context, cjsModule, platform);
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;