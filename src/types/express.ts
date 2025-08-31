import { Request, Response } from 'express';
import { AuthTokenPayload, User } from './index';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      userDetails?: User;
    }
  }
}

// Custom Request types
export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
  userDetails?: User;
}

// Custom Response types with typed JSON methods
export interface TypedResponse<T = any> extends Response {
  json(body: T): this;
}

// API Response helpers
export interface ApiResponseBody<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponseBody<T> extends ApiResponseBody<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Controller method type
export type ControllerMethod<
  TRequest = Request,
  TResponse = any
> = (
  req: TRequest,
  res: TypedResponse<TResponse>,
  next?: any
) => Promise<void> | void;

// Authenticated controller method type
export type AuthenticatedControllerMethod<TResponse = any> = ControllerMethod<
  AuthenticatedRequest,
  TResponse
>;

// Route handler types
export type RouteHandler = ControllerMethod;
export type AuthenticatedRouteHandler<TResponse = any> = AuthenticatedControllerMethod<TResponse>;

export default {};
