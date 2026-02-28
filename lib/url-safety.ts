type UrlSanitizeOptions = {
  allowRelative?: boolean;
};

export function sanitizePublicUrl(input: unknown, options: UrlSanitizeOptions = {}): string | null {
  if (typeof input !== 'string') return null;

  const value = input.trim();
  if (!value) return null;

  if (options.allowRelative && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
