export default () => ({
  port: parseInt(process.env['PORT'] || '3000', 10),
  database: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/vtexday26',
    options: {
      retryWrites: true,
      w: 'majority',
    },
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-secret-key',
    accessExpiration: process.env['JWT_ACCESS_EXPIRATION'] || '15m',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] || '7d',
    refreshSecret:
      process.env['JWT_REFRESH_SECRET'] || process.env['JWT_SECRET'] || 'your-refresh-secret',
  },
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'],
  },
  aws: {
    s3: {
      bucket: process.env['AWS_S3_BUCKET'],
      region: process.env['AWS_REGION'] || 'us-east-1',
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
    },
  },
  cors: {
    origin: process.env['CORS_ORIGIN'] || '*',
  },
});
