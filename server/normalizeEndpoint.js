const { URL } = require('url');

const normalizeEndpoint = (raw) => {
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
    return { protocol: u.protocol.replace(':', ''), host: u.host };
  }

  return { protocol: 'https', host: s };
};

const validateBucketName = (bucket) => {
  if (!bucket) {
    throw new Error('TOS_BUCKET missing');
  }
  if (bucket.includes('://') || bucket.toLowerCase().startsWith('http')) {
    throw new Error('TOS_BUCKET should be plain bucket name like "ai-ppt-video-assets", not a URL.');
  }
  if (bucket.endsWith('.https') || bucket.endsWith('.http')) {
    throw new Error(`Invalid bucket name: "${bucket}". Please remove protocol hints.`);
  }
};

module.exports = {
  normalizeEndpoint,
  validateBucketName
};
