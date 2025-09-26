import { env } from '@/config/env.mjs';

const HOSTNAME_REGEX = /^[\w.-]+(:\d+)?$/;

function normalizeBaseUrl(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  let trimmed = candidate.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    if (HOSTNAME_REGEX.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    const base = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');

    return base || parsed.origin;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Invalid site URL candidate ignored:', candidate, error);
    }

    return null;
  }
}

function resolveBaseUrl() {
  const candidates: Array<string | undefined | null> = [];

  if (typeof window === 'undefined') {
    candidates.push(env.APP_BASE_URL, env.NEXT_PUBLIC_SITE_URL);
  } else {
    candidates.push(process.env.NEXT_PUBLIC_SITE_URL ?? window.location?.origin);
  }

  if (process.env.VERCEL_URL) {
    candidates.push(process.env.VERCEL_URL);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    candidates.push(window.location.origin);
  }

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);

    if (normalized) {
      return normalized;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  return null;
}

export function buildAbsoluteUrl(path: string | URL = '/') {
  if (path instanceof URL) {
    return path.toString();
  }

  const baseUrl = resolveBaseUrl();

  if (!baseUrl) {
    throw new Error('Kunde inte fastställa bas-URL för buildAbsoluteUrl.');
  }

  if (typeof path === 'string') {
    const trimmed = path.trim();

    if (!trimmed) {
      return baseUrl;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    return `${baseUrl}${withLeadingSlash}`;
  }

  const stringified = String(path ?? '');
  const normalized = stringified.startsWith('/') ? stringified : `/${stringified}`;

  return `${baseUrl}${normalized}`;
}

export function getSiteBaseUrl() {
  return resolveBaseUrl();
}
