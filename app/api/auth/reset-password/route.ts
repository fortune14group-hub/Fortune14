import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getSupabaseServiceRoleClient } from '@/lib/supabaseAdmin';
import { buildAbsoluteUrl } from '@/lib/siteUrl';
import { getClientIdentifier } from '@/server/requestUtils';
import { sensitiveLimiter } from '@/server/rateLimiter';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success } = await sensitiveLimiter.limit(identifier);

  if (!success) {
    return NextResponse.json({ message: 'För många försök, försök igen senare.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Ogiltig e-postadress.' }, { status: 400 });
  }

  const { email } = parsed.data;
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAbsoluteUrl('/update-password'),
  });

  if (error) {
    return NextResponse.json({ message: 'Kunde inte initiera återställning.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Om adressen finns skickar vi en länk för återställning.' });
}
