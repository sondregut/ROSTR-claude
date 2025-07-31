const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for better module resolution
config.resolver = {
  ...config.resolver,
  // Add support for .cjs files
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  // Ensure proper resolution of node_modules
  nodeModulesPaths: ['./node_modules'],
};

// Add transformer options for production optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: false, // Changed to false for smaller bundle
    mangle: {
      keep_fnames: false, // Changed to false for smaller bundle
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      reduce_funcs: true,
      reduce_vars: true,
      keep_classnames: false,
      keep_fnames: false,
      keep_infinity: false,
      passes: 2,
    },
  },
};

// Server configuration for better development experience
config.server = {
  ...config.server,
  // Increase timeout for slow network requests
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // The res object in connect middleware uses setHeader, not header
      if (res.setHeader) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;