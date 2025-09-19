import { createClient } from '@supabase/supabase-js';

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

let browserClient = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Supabase-klienten saknar nödvändiga miljövariabler (${missing.join(', ')}). Lägg till dem i din miljö och deploya om.`
    );
  }

  browserClient = createClient(
    requiredEnv.NEXT_PUBLIC_SUPABASE_URL,
    requiredEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return browserClient;
}
