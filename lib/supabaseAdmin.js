import { createClient } from '@supabase/supabase-js';

const requiredEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
};

let adminClient = null;

export function getSupabaseServiceRoleClient() {
  if (adminClient) {
    return adminClient;
  }

  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Supabase admin-klienten saknar nödvändiga miljövariabler (${missing.join(', ')}). Lägg till dem i din miljö och deploya om.`
    );
  }

  adminClient = createClient(requiredEnv.SUPABASE_URL, requiredEnv.SUPABASE_SERVICE_ROLE);
  return adminClient;
}
