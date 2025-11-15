/**
 * Step 0: API Error Types
 * 
 * Provides typed error classes for consistent error handling across the API layer.
 * All API operations throw these error types for predictable error handling.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends ApiError {
  constructor(field: string, message: string, context?: Record<string, unknown>) {
    super(
      `Validation failed for ${field}: ${message}`,
      'VALIDATION_ERROR',
      400,
      { field, ...context }
    );
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string, context?: Record<string, unknown>) {
    super(
      `${resource} with id ${id} not found`,
      'NOT_FOUND',
      404,
      { resource, id, ...context }
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access', context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, context);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, context);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(
    serviceName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      `External service error from ${serviceName}: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      { serviceName, ...context }
    );
    this.name = 'ExternalServiceError';
  }
}
