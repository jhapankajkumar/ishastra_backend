// Common types used across the application

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: number;
  userId: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: number;
  userId: number;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: number;
  userId: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  positions: Position[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthTokenPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

// Technical Analysis types
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: Date | string;
}

export interface TechnicalIndicators {
  ema?: {
    ema12?: number[];
    ema13?: number[];
    ema20?: number[];
    ema26?: number[];
    ema50?: number[];
    ema200?: number[];
  };
  sma?: {
    sma20?: number[];
    sma50?: number[];
  };
  rsi?: number[];
  macd?: any[];
  bollinger?: any[];
  atr?: number[];
  stochastic?: any[];
  adx?: number[];
  superTrend?: any[];
  directionalMovement?: {
    plusDI?: number[];
    minusDI?: number[];
  };
  volume?: {
    avgVolume20?: number[];
    volumeRatio?: number[];
  };
  latest?: {
    [key: string]: any;
  };
  aiSignals?: {
    [key: string]: any;
  };
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface ServerConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  corsOrigin: string[];
  jwtSecret: string;
  jwtExpiresIn: string;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
