import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client with anon key for public operations
export const supabasePublic = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Database connection string for Prisma (if needed)
export const getDatabaseUrl = () => {
  // Extract database connection details from Supabase URL
  const url = new URL(config.SUPABASE_URL);
  const host = url.hostname;
  const port = '5432';
  const database = 'postgres';
  const username = 'postgres';
  const password = config.SUPABASE_SERVICE_ROLE_KEY; // Use service role key as password
  
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
};
