export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };

  static success<T>(data: T, metadata?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  static error(error: any): ApiResponse {
    return {
      success: false,
      error,
    };
  }
}
