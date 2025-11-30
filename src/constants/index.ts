// App constants
// Colors, API endpoints, etc.
// Using Apple's design system colors

export const COLORS = {
  // Primary colors (Apple black)
  primary: '#000000',
  primaryLight: '#1C1C1E',
  primaryDark: '#000000',
  
  // System colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemPurple: '#5856D6',
  
  // Background colors (Apple system)
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  
  // Text colors (Apple system)
  label: '#000000',
  labelSecondary: '#8E8E93',
  labelTertiary: '#C7C7CC',
  
  // Separator colors
  separator: '#C6C6C8',
  separatorOpaque: '#38383A',
  
  // Legacy aliases for compatibility
  secondary: '#5856D6',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  text: '#000000',
  textSecondary: '#8E8E93',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  CUSTOMER: {
    PROFILE: '/customer/profile',
    VEHICLES: '/customer/vehicles',
  },
  MECHANIC: {
    PROFILE: '/mechanic/profile',
    REQUESTS: '/mechanic/requests',
  },
  VENDOR: {
    PROFILE: '/vendor/profile',
    PRODUCTS: '/vendor/products',
  },
  MARKETPLACE: {
    PRODUCTS: '/marketplace/products',
    ORDERS: '/marketplace/orders',
  },
};

