import { NativeModules } from 'react-native';

// 1. Disable React Native default ExceptionsManager
global.__fbDisableExceptionsManager = true;

// 2. Intercept ErrorUtils safely
if (typeof global !== 'undefined') {
  if (!global.ErrorUtils) {
    global.ErrorUtils = {};
  }
  const safeHandler = (error, isFatal) => {
    console.warn('[ZeroCrash Shield] Suppressed error (isFatal=' + isFatal + '):', error);
  };
  try {
    if (typeof global.ErrorUtils.setGlobalHandler === 'function') {
      global.ErrorUtils.setGlobalHandler(safeHandler);
    }
  } catch (e) {}
  global.ErrorUtils.reportFatalError = safeHandler;
  global.ErrorUtils.reportError = safeHandler;
}

// 3. Monkey-patch NativeModules.ExceptionsManager to prevent native abort()
try {
  if (NativeModules && NativeModules.ExceptionsManager) {
    NativeModules.ExceptionsManager.reportFatalException = (message, stack, id) => {
      console.warn('[ZeroCrash Shield] Suppressed reportFatalException:', message);
    };
    NativeModules.ExceptionsManager.reportException = (data) => {
      console.warn('[ZeroCrash Shield] Suppressed reportException:', data);
    };
  }
} catch (e) {
  console.warn('[ZeroCrash Shield] Init error:', e);
}
