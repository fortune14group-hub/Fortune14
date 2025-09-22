export function buildAbsoluteUrl(path = '/') {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envUrl) {
    const normalizedBase = envUrl.replace(/\/+$/, '');
    return `${normalizedBase}${sanitizedPath}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${sanitizedPath}`;
  }

  return undefined;
}
