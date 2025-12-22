const { TosClient } = require('@volcengine/tos-sdk');
const axios = require('axios');
const dns = require('dns');
const { normalizeEndpoint, validateBucketName } = require('./normalizeEndpoint');

let tosClient = null;
let cachedConfig = null;

const buildTosClient = (taskId) => {
  const accessKeyId = process.env.VOLC_ACCESS_KEY_ID || process.env.VOLC_ACCESSKEY;
  const secretKey = process.env.VOLC_SECRET_ACCESS_KEY || process.env.VOLC_SECRETKEY;
  const bucket = (process.env.VOLC_TOS_BUCKET || '').trim();
  const region = (process.env.VOLC_TOS_REGION || '').trim();
  const endpointRaw = (process.env.VOLC_TOS_ENDPOINT || '').trim();

  if (!accessKeyId || !secretKey) {
    throw new Error('缺少 TOS 配置：请设置 VOLC_ACCESS_KEY_ID、VOLC_SECRET_ACCESS_KEY');
  }

  if (!bucket || !region || !endpointRaw) {
    throw new Error(`[ENV MISSING] bucket=${bucket} region=${region} endpoint=${endpointRaw}`);
  }

  validateBucketName(bucket);

  const endpoint = normalizeEndpoint(endpointRaw);
  const endpointHost = endpoint.host;
  const endpointProtocol = endpoint.protocol || 'https';
  const endpointUrl = `${endpointProtocol}://${endpointHost}`;

  const finalHost = endpointHost.startsWith(`${bucket}.`) ? endpointHost : `${bucket}.${endpointHost}`;
  if (finalHost.endsWith('.https') || finalHost.endsWith('.http') || finalHost.includes('://')) {
    throw new Error(`Invalid finalHost computed: ${finalHost}`);
  }

  const baseUrl = `${endpointProtocol}://${finalHost}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('[TOS SDK endpointUrl]', endpointUrl);
  }

  const client = new TosClient({
    accessKeyId,
    accessKeySecret: secretKey,
    bucket,
    region,
    endpoint: endpointUrl
  });

  if (process.env.NODE_ENV !== 'production') {
    try {
      dns.lookup(finalHost, (err, address) => {
        if (err) {
          console.warn(`[ppt-to-video][tos] dns lookup failed for ${finalHost}`, err.message);
        } else {
          console.log(`[ppt-to-video][tos] dns lookup ${finalHost} -> ${address}`);
        }
      });
    } catch {
      // ignore dns errors
    }
  }

  return { client, bucket, region, endpointHost, endpointProtocol, finalHost, baseUrl, endpointUrl };
};

const getTosClient = (taskId) => {
  if (tosClient && cachedConfig) {
    return { client: tosClient, ...cachedConfig };
  }
  const config = buildTosClient(taskId);
  tosClient = config.client;
  cachedConfig = { ...config };
  return { client: tosClient, ...cachedConfig };
};

const uploadToTos = async ({ key, body, contentType = 'application/octet-stream', taskId }) => {
  const { client, bucket, region, endpointHost, endpointProtocol, finalHost, baseUrl, endpointUrl } = getTosClient(taskId);

  const finalUrl = new URL(`/${encodeURIComponent(key).replace(/%2F/g, '/')}`, baseUrl).toString();

  if (process.env.NODE_ENV !== 'production') {
    console.log('[ppt-to-video][upload-debug]', {
      bucket,
      region,
      endpointHost,
      endpointProtocol,
      endpointUrl,
      finalHost,
      finalUrl,
      key,
      size: body?.length || body?.byteLength || 0
    });
  }

  try {
    await client.putObject({
      bucket,
      key,
      body,
      contentLength: body.length || body.byteLength || 0,
      contentType
    });
  } catch (err) {
    console.error('[ppt-to-video][upload-error]', { finalHost, endpointUrl, err: err?.stack || err?.message || err });
    throw err;
  }

  let url = finalUrl;
  try {
    const signed = await client.getPreSignedUrl({
      method: 'GET',
      key,
      expires: 3600
    });
    if (signed?.signedUrl) {
      url = signed.signedUrl;
    }
  } catch (e) {
    console.warn('[ppt-to-video][tos] presign failed, fallback to public URL', e?.message || e);
  }

  try {
    const headRes = await axios.head(url, { validateStatus: (s) => s < 500 });
    if (headRes.status >= 400) {
      throw new Error(`图片 URL 不可访问: ${url} status=${headRes.status}`);
    }
  } catch (e) {
    console.error('[ppt-to-video][head-check-error]', { finalHost, endpointUrl, url, err: e?.stack || e?.message || e });
    throw e;
  }

  return { url, finalHost, endpointHost, endpointProtocol };
};

module.exports = {
  uploadToTos,
  getTosClient
};
