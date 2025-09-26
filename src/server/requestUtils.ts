import type { NextRequest } from 'next/server';

export const getClientIdentifier = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'anonymous';
  }

  return request.ip ?? 'anonymous';
};
