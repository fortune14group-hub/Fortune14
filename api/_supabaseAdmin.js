// api/_supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,          // samma URL som i appen
  process.env.SUPABASE_SERVICE_ROLE  // Service Role (hemlig – endast på server)
);
