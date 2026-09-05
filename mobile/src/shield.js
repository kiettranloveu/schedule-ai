import { NativeModules } from 'react-native';

// 1. Intercept ErrorUtils
if (typeof global !== 'undefined') {
  if (!global.ErrorUtils) {
    global.ErrorUtils = {};
  }
  const originalSetGlobalHandler = global.ErrorUtils.setGlobalHandler;
  global.ErrorUtils.setGlobalHandler = (fn) => {
    if (typeof originalSetGlobalHandler === 'function') {
      try {
        originalSetGlobalHandler((err) => {
          console.warn('[ZeroCrash Shield] ErrorUtils caught:', err);
          try {
            if (typeof fn === 'function') {
              fn(err, false);
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
  };
  global.ErrorUtils.reportFatalError = (error) => {
    console.warn('[ZeroCrash Shield] Intercepted fatal error:', error);
  };
}

// 2. Monkey-patch NativeModules.ExceptionsManager to prevent native abort() trap: 6
try {
  if (NativeModules && NativeModules.ExceptionsManager) {
    NativeModules.ExceptionsManager.reportFatalException = (message, stack, id) => {
      console.warn('[ZeroCrash Shield] Blocked native reportFatalException:', message);
    };
    NativeModules.ExceptionsManager.reportException = (data) => {
      console.warn('[ZeroCrash Shield] Blocked native reportException:', data);
    };
  }
} catch (e) {
  console.warn('[ZeroCrash Shield] Init error:', e);
}
