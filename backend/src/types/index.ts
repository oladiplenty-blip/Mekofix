// TypeScript type definitions for the backend
// Types will be added as they are implemented

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

