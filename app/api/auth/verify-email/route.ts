import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { VerifyEmail } from '@/emails/VerifyEmail';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseAdmin';
import { buildAbsoluteUrl } from '@/lib/siteUrl';
import { sendTransactionalEmail } from '@/server/email/mailer';
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

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Ogiltig e-postadress.' }, { status: 400 });
  }

  const { email } = parsed.data;

  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ message: 'Kunde inte generera bekräftelselänk.' }, { status: 500 });
  }

  const actionUrl = buildAbsoluteUrl(data.properties.action_link);

  await sendTransactionalEmail({
    to: email,
    subject: 'Bekräfta din e-postadress till BetSpread',
    react: VerifyEmail({ actionUrl, userEmail: email }),
  });

  return NextResponse.json({ message: 'Bekräftelse skickad om adressen finns registrerad.' });
}
