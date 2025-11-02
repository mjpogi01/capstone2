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
const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 
                        (process.env.NODE_ENV === 'development' 
                          ? `http://localhost:4000` 
                          : `http://localhost:4000`);

// Export the API URL
export const API_URL = DEFAULT_API_URL;

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










