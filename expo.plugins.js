const { withInfoPlist } = require('@expo/config-plugins');

// This plugin adds necessary iOS configurations for network requests
module.exports = function withNetworkConfig(config) {
  return withInfoPlist(config, (config) => {
    // Add App Transport Security settings to allow HTTPS requests
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
      NSAllowsArbitraryLoadsInWebContent: false,
      NSExceptionDomains: {
        'supabase.co': {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: false,
          NSExceptionRequiresForwardSecrecy: true,
          NSExceptionMinimumTLSVersion: 'TLSv1.2',
          NSThirdPartyExceptionRequiresForwardSecrecy: true,
        },
        'supabase.io': {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: false,
          NSExceptionRequiresForwardSecrecy: true,
          NSExceptionMinimumTLSVersion: 'TLSv1.2',
          NSThirdPartyExceptionRequiresForwardSecrecy: true,
        },
      },
    };

    // Add required background modes for network requests
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('fetch')) {
      config.modResults.UIBackgroundModes.push('fetch');
    }

    return config;
  });
};