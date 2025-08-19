import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  // Legacy database URL (optional for migration)
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_KEY: z.string().optional(),
  S3_SECRET: z.string().optional(),
  WEBHOOK_TOKEN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(), // comma-separated
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  // CAPTCHA
  CAPTCHA_PROVIDER: z.enum(['none', 'hcaptcha', 'recaptcha']).default('none'),
  HCAPTCHA_SECRET: z.string().optional(),
  RECAPTCHA_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Should not happen with optional fields + defaults, but keep for safety
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration', parsed.error.flatten());
  throw new Error('Invalid environment configuration');
}

const raw = parsed.data;
const parsedCorsOrigins = raw.CORS_ORIGINS
  ? raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
  : undefined;

export const config = {
  ...raw,
  CORS_ORIGINS: parsedCorsOrigins as string[] | undefined,
  isProduction: raw.NODE_ENV === 'production',
};
