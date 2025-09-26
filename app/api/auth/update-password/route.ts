import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { getClientIdentifier } from '@/server/requestUtils';
import { sensitiveLimiter } from '@/server/rateLimiter';

const schema = z.object({
  password: z.string().min(8, 'Lösenordet måste innehålla minst 8 tecken.'),
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
    return NextResponse.json({ message: 'Ogiltigt lösenord.' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Ingen aktiv session.' }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ message: 'Kunde inte uppdatera lösenord.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Lösenordet är uppdaterat.' });
}
