// Environment variables interface
export interface EnvironmentVariables {
  // Server configuration
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Database
  DATABASE_URL: string;
  
  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // CORS Configuration
  CORS_ORIGIN: string;
  
  // Email Configuration (if used)
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  
  // External API Configuration
  ALPHA_VANTAGE_API_KEY?: string;
  YAHOO_FINANCE_API_KEY?: string;
  
  // File Upload Configuration
  UPLOAD_PATH?: string;
  MAX_FILE_SIZE?: string;
  
  // Redis Configuration (if used)
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  
  // Logging Configuration
  LOG_LEVEL?: string;
  LOG_DIR?: string;
}

// Configuration object after processing environment variables
export interface ProcessedConfig {
  server: {
    port: number;
    env: 'development' | 'production' | 'test';
    corsOrigin: string[];
  };
  
  database: {
    url: string;
  };
  
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  
  upload: {
    path: string;
    maxFileSize: number;
  };
  
  external: {
    alphaVantageApiKey?: string;
    yahooFinanceApiKey?: string;
  };
  
  email?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
  };
  
  logging: {
    level: string;
    directory: string;
  };
}

export default EnvironmentVariables;
