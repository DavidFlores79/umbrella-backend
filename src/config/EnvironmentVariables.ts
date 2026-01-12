export interface EnvironmentVariables {
  PORT: number;
  DEPLOY_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  JWT_ISSUER: string;
  JWT_PRIVATE_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SID: string;
  SALT_ROUND: string;
  // AWS S3 Configuration
  AWS_REGION_NAME: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_BUCKET_NAME: string;
}
