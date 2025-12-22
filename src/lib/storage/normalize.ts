export type NormalizedEndpoint = {
  protocol: 'https' | 'http';
  host: string;
};

export function normalizeEndpoint(raw: string): NormalizedEndpoint {
  if (!raw) {
    throw new Error('TOS_ENDPOINT missing');
  }

  let s = raw.trim();

  if (s.toLowerCase() === 'https' || s.toLowerCase() === 'http') {
    throw new Error(`Invalid endpoint host: "${s}". Please provide a full host like "tos-cn-beijing.volces.com".`);
  }

  if (s.endsWith('.https') || s.endsWith('.http')) {
    throw new Error(`Invalid endpoint host: "${s}". Did you mean "https://<host>"?`);
  }

  if (s.startsWith('http://') || s.startsWith('https://')) {
    const u = new URL(s);
    return { protocol: u.protocol.replace(':', '') as 'https' | 'http', host: u.host };
  }

  return { protocol: 'https', host: s };
}
