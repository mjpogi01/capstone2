/**
 * API Configuration
 * 
 * For Desktop/Browser Testing:
 * - Uses localhost:4000 (default)
 * 
 * For Mobile Device Testing:
 * - Set REACT_APP_API_URL=http://192.168.254.100:4000 in .env.local
 * - Or update DEFAULT_API_URL below to your computer's IP
 */

// Your computer's local IP address (for mobile testing)
const COMPUTER_IP = '192.168.254.100';

// Default API URL - automatically switches based on environment
// For production, set REACT_APP_API_URL in .env.production or build-time environment
// If not set, it will try to auto-detect at runtime (for separate deployment)
const getApiUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000';
  }
  
  // In production without explicit URL, use the same domain
  // The backend API is on the same domain (Render handles routing)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // Use the same origin (same domain) for API calls
    // Render will route /api/* requests to the backend service
    if (hostname && hostname.includes('onrender.com')) {
      return window.location.origin;
    }
    // For other production domains, use the same origin
    return window.location.origin;
  }
  
  return 'http://localhost:4000'; // Fallback
};

// Export the API URL
export const API_URL = getApiUrl();

// For mobile testing, uncomment this line:
// export const API_URL = `http://${COMPUTER_IP}:4000`;

// Helper to check if running on mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Log the API URL on startup (helpful for debugging)
console.log('🔗 API URL:', API_URL);
console.log('📱 Mobile Device:', isMobileDevice());

export default API_URL;


































