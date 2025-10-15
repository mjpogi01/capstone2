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
