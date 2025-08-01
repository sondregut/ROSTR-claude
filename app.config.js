export default {
  expo: {
    name: "RostrDating",
    slug: "RostrDating",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rostrdating",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    ios: {
      bundleIdentifier: "com.sondregut.rostrdating",
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Allow RostrDating to access your photos to add profile pictures for people you're dating.",
        NSCameraUsageDescription: "Allow RostrDating to access your camera to take profile pictures.",
        NSContactsUsageDescription: "Allow RostrDating to access your contacts to find friends and send invites.",
        NSUserNotificationUsageDescription: "Allow RostrDating to send you notifications about new dates, comments, and activity from your friends.",
        NSAllowsArbitraryLoads: false,
        NSAllowsLocalNetworking: true,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
            localhost: {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true
            },
            "supabase.co": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: "TLSv1.2"
            },
            "supabase.io": {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: "TLSv1.2"
            }
          }
        },
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.sondregut.rostrdating",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFF8F3"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.READ_CONTACTS",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-dev-client",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFF8F3"
        }
      ],
      "expo-web-browser",
      "expo-apple-authentication",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow RostrDating to access your photos to add profile pictures for people you're dating.",
          cameraPermission: "Allow RostrDating to access your camera to take profile pictures."
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            useLegacyPackaging: false
          },
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      "./expo.plugins.js"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "bda19927-debe-46ff-a855-28e21348c0de"
      },
      // Add environment variables to extra so they're accessible via Constants.expoConfig.extra
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      env: process.env.EXPO_PUBLIC_ENV || "development",
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true",
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === "true",
      enableTestUsers: process.env.EXPO_PUBLIC_ENABLE_TEST_USERS === "true",
      showDevMenu: process.env.EXPO_PUBLIC_SHOW_DEV_MENU === "true",
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN
    }
  }
};