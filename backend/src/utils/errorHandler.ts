import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export interface EnhancedError extends Error {
  status?: number;
  code?: string;
  details?: any;
  requestId?: string;
  provider?: string;
  model?: string;
}

export class APIError extends Error {
  public status: number;
  public code?: string;
  public details?: any;
  public requestId?: string;
  public provider?: string;
  public model?: string;

  constructor(
    message: string,
    status: number = 500,
    code?: string,
    details?: any,
    provider?: string,
    model?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.provider = provider;
    this.model = model;
    this.requestId = this.generateRequestId();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ProviderError extends APIError {
  constructor(
    message: string,
    provider: string,
    model?: string,
    originalError?: any,
    status: number = 500
  ) {
    super(message, status, 'PROVIDER_ERROR', originalError, provider, model);
    this.name = 'ProviderError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string, provider?: string) {
    super(message, 401, 'AUTHENTICATION_ERROR', undefined, provider);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, resource?: string) {
    super(message, 404, 'NOT_FOUND_ERROR', { resource });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string, provider?: string) {
    super(message, 429, 'RATE_LIMIT_ERROR', undefined, provider);
    this.name = 'RateLimitError';
  }
}

export const errorLogger = {
  error: (message: string, error?: any, context?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code,
        requestId: error.requestId,
        provider: error.provider,
        model: error.model,
      } : undefined,
      context,
    };
    
    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  },

  warn: (message: string, context?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'WARN',
      message,
      context,
    };
    
    console.warn('[WARN]', JSON.stringify(logEntry, null, 2));
  },

  info: (message: string, context?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'INFO',
      message,
      context,
    };
    
    console.log('[INFO]', JSON.stringify(logEntry, null, 2));
  },

  debug: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: 'DEBUG',
        message,
        context,
      };
      
      console.debug('[DEBUG]', JSON.stringify(logEntry, null, 2));
    }
  },
};

export const createUserFriendlyError = (error: any, provider?: string, model?: string): string => {
  // If it's already a user-friendly error, return it
  if (error instanceof APIError) {
    return error.message;
  }

  // Handle common error patterns
  if (error.response) {
    const status = error.response.status;
    const errorData = error.response.data;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return provider 
          ? `Authentication failed for ${provider}. Please check your API key.`
          : 'Authentication failed. Please check your API key.';
      case 403:
        return provider
          ? `Access denied for ${provider}. Please check your API key permissions.`
          : 'Access denied. Please check your permissions.';
      case 404:
        if (provider && model) {
          return `The model "${model}" is not available for ${provider}. Please try a different model or check the model name.`;
        } else if (provider) {
          return `The ${provider} service is currently unavailable. Please try a different provider.`;
        }
        return 'The requested resource was not found. Please try a different configuration.';
      case 429:
        return provider
          ? `Rate limit exceeded for ${provider}. Please try again later.`
          : 'Rate limit exceeded. Please try again later.';
      case 500:
        return provider
          ? `${provider} service is experiencing issues. Please try again later.`
          : 'Server error. Please try again later.';
      case 503:
        return provider
          ? `${provider} service is temporarily unavailable. Please try again later.`
          : 'Service temporarily unavailable. Please try again later.';
      default:
        return `Service error (${status}). Please try again later.`;
    }
  }

  // Handle network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return provider
      ? `Cannot connect to ${provider} service. Please check your internet connection.`
      : 'Network error. Please check your internet connection.';
  }

  // Handle timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return provider
      ? `Request to ${provider} timed out. Please try again.`
      : 'Request timed out. Please try again.';
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again later.';
};

export const handleProviderError = (error: any, provider: string, model?: string): never => {
  const userMessage = createUserFriendlyError(error, provider, model);
  
  errorLogger.error(`Provider error for ${provider}`, error, {
    provider,
    model,
    originalError: {
      message: error.message,
      status: error.status || error.response?.status,
      code: error.code,
      stack: error.stack,
    }
  });

  throw new ProviderError(userMessage, provider, model, error, error.status || error.response?.status || 500);
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log the error
  errorLogger.error('Request error', error, {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: error.message || 'An unexpected error occurred',
    message: error.message || 'An unexpected error occurred',
    code: error.code,
  };

  // Add request ID for debugging
  res.setHeader('X-Request-ID', requestId);

  // Set status code
  const statusCode = error.status || error.statusCode || 500;
  
  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 