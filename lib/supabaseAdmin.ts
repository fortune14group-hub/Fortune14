import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/config/env.mjs';

let adminClient: SupabaseClient | null = null;

export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
