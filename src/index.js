import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Handle Ethereum extension conflicts
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Cannot redefine property: ethereum')) {
    console.warn('Ethereum extension conflict detected and handled gracefully');
    event.preventDefault();
    return false;
  }
  // Suppress ResizeObserver loop errors (harmless browser quirk)
  if (event.message && event.message.includes('ResizeObserver loop')) {
    event.preventDefault();
    return false;
  }
  // Suppress Leaflet heat layer canvas context errors (timing issue)
  if (event.message && event.message.includes('clearRect') && event.message.includes('Cannot read properties of undefined')) {
    // Check if it's from the heat layer by checking the stack trace or source
    const source = event.filename || event.source || '';
    if (source.includes('bundle.js') || source.includes('leaflet') || source.includes('heat')) {
      // This is the heat layer canvas context timing error - suppress it
      event.preventDefault();
      return false;
    }
  }
  // Suppress reCAPTCHA timeout errors (handled gracefully in component)
  if (event.message && (event.message.includes('Timeout') || event.message.includes('timeout'))) {
    const source = event.filename || event.source || '';
    if (source.includes('recaptcha') || source.includes('gstatic')) {
      console.warn('reCAPTCHA timeout error handled gracefully');
      event.preventDefault();
      return false;
    }
  }
});

// Also handle unhandled promise rejections for ResizeObserver
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver loop')) {
    event.preventDefault();
    return false;
  }
  // Suppress reCAPTCHA timeout promise rejections
  if (event.reason && (event.reason.message && (event.reason.message.includes('Timeout') || event.reason.message.includes('timeout')))) {
    const stack = event.reason.stack || '';
    if (stack.includes('recaptcha') || stack.includes('gstatic') || event.reason.message.includes('recaptcha')) {
      console.warn('reCAPTCHA timeout promise rejection handled gracefully');
      event.preventDefault();
      return false;
    }
  }
});

// Prevent Ethereum property redefinition errors
if (typeof window !== 'undefined') {
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (prop === 'ethereum' && obj === window) {
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (error) {
        if (error.message.includes('Cannot redefine property')) {
          console.warn('Ethereum property already exists, skipping redefinition');
          return obj;
        }
        throw error;
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
}

// Prevent app reload on window focus (alt-tab)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Prevent webpack dev server from reloading on window focus
  let isPreventingReload = false;
  let lastBlurTime = 0;

  // Intercept beforeunload to prevent reloads triggered by webpack dev server
  window.addEventListener('beforeunload', (e) => {
    if (isPreventingReload) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return (e.returnValue = '');
    }
  }, true);

  // Track window focus/blur to detect alt-tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Window regained focus
      const timeSinceBlur = Date.now() - lastBlurTime;
      // If focus was regained quickly (likely alt-tab), prevent reload
      if (timeSinceBlur > 0 && timeSinceBlur < 5000) {
        isPreventingReload = true;
        setTimeout(() => {
          isPreventingReload = false;
        }, 2000);
      }
    } else {
      // Window lost focus
      lastBlurTime = Date.now();
    }
  });

  // Prevent webpack dev server socket from triggering reload on reconnect
  if (window.__webpack_dev_server_client__) {
    const client = window.__webpack_dev_server_client__;
    if (client && client.socket) {
      const originalEmit = client.socket.emit;
      client.socket.emit = function(event, ...args) {
        // Prevent reload events triggered by socket reconnection
        if (isPreventingReload && (event === 'reload' || event === 'static-changed')) {
          console.log('🚫 Prevented webpack dev server reload on focus');
          return;
        }
        return originalEmit.apply(this, [event, ...args]);
      };
    }
  }

  // Intercept any script tags that might trigger reload
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    if (child && child.tagName === 'SCRIPT' && isPreventingReload) {
      const src = child.getAttribute('src');
      if (src && src.includes('webpack')) {
        console.log('🚫 Prevented webpack script injection on focus');
        return child;
      }
    }
    return originalAppendChild.call(this, child);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
