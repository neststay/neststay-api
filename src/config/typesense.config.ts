import { registerAs } from '@nestjs/config';

export default registerAs('typesense', () => ({
  host: process.env.TYPESENSE_HOST,
  port: Number(process.env.TYPESENSE_PORT) || 8108,
  protocol: process.env.TYPESENSE_PROTOCOL ?? 'http',
  apiKey: process.env.TYPESENSE_API_KEY,
}));
