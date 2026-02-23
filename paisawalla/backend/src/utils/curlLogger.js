import { logger } from './logger.js';

function buildCurlCommand({ method, url, headers, body, contentType }) {
  const parts = [`curl --location --request ${method.toUpperCase()} '${url}'`];

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      parts.push(`--header '${key}: ${value}'`);
    }
  }

  if (body) {
    if (contentType === 'form-urlencoded' || body instanceof URLSearchParams) {
      const bodyStr = body instanceof URLSearchParams ? body.toString() : body;
      parts.push(`--data '${bodyStr}'`);
    } else {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      parts.push(`--data '${bodyStr}'`);
    }
  }

  return parts.join(' \\\n');
}

export function logCurl({ label, method, url, headers, body, contentType }) {
  try {
    const curlCmd = buildCurlCommand({ method, url, headers, body, contentType });
    logger.info(`[CURL] ${label}`, { curl: curlCmd });
  } catch (err) {
    logger.warn(`[CURL] Failed to generate curl for ${label}`, { error: err.message });
  }
}
