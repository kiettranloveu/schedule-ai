import { registerRootComponent } from 'expo';
import App from './App';

// Global Crash Interceptor to prevent RCTExceptionsManager reportFatal abort
if (typeof global !== 'undefined' && global.ErrorUtils) {
  try {
    const originalHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.warn('[GlobalErrorHandler] Caught error (isFatal=' + isFatal + '):', error);
      // Pass isFatal=false so RCTExceptionsManager logs without calling native abort()
      if (originalHandler) {
        try {
          originalHandler(error, false);
        } catch (e) {
          console.warn('Original error handler failure:', e);
        }
      }
    });
  } catch (err) {
    console.warn('Failed to attach ErrorUtils handler:', err);
  }
}

registerRootComponent(App);
