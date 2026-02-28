function normalizeIp(value: string): string | null {
  const trimmed = value.trim().replace(/^"+|"+$/g, '');
  if (!trimmed) return null;

  // Handle IPv4 "ip:port" form forwarded by some proxies.
  if (trimmed.includes('.') && trimmed.includes(':')) {
    const idx = trimmed.lastIndexOf(':');
    const ipPart = trimmed.slice(0, idx);
    if (ipPart && /^\d+$/.test(trimmed.slice(idx + 1))) {
      return ipPart;
    }
  }

  // Handle bracketed IPv6 "[::1]:1234" or "[::1]".
  if (trimmed.startsWith('[')) {
    const closing = trimmed.indexOf(']');
    if (closing > 0) {
      return trimmed.slice(1, closing);
    }
  }

  return trimmed;
}

export function getClientIp(request: Request): string {
  const realIp = normalizeIp(request.headers.get('x-real-ip') || '');
  if (realIp) return realIp;

  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  if (forwardedFor) {
    const parts = forwardedFor
      .split(',')
      .map((part) => normalizeIp(part))
      .filter((part): part is string => Boolean(part));

    // With nginx proxy_add_x_forwarded_for, the right-most entry is the direct client.
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return 'unknown';
}
