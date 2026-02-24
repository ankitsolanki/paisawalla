import ApiLog from '../models/ApiLog.js';

const MAX_DB_ENTRIES = 500;

const SENSITIVE_KEYS = [
  'access_key', 'accesskey', 'authorization', 'bearer',
  'client_secret', 'clientsecret', 'password', 'secret',
  'otp', 'token', 'access_token', 'refresh_token',
  'client_id', 'clientid', 'vouchercode', 'voucherCode',
];

function sanitizeValue(key, value) {
  if (!value || typeof value !== 'string') return value;
  const lower = key.toLowerCase().replace(/[-_]/g, '');
  if (SENSITIVE_KEYS.some(sk => lower.includes(sk.replace(/[-_]/g, '')))) {
    if (value.length <= 8) return '***';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
  return value;
}

function sanitizeObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return obj;
  if (obj instanceof URLSearchParams) {
    const sanitized = {};
    for (const [key, value] of obj.entries()) {
      sanitized[key] = sanitizeValue(key, value);
    }
    return sanitized;
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !(value instanceof URLSearchParams)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = sanitizeValue(key, typeof value === 'string' ? value : String(value ?? ''));
    }
  }
  return sanitized;
}

export function logApiCall({ service, method, url, requestHeaders, requestBody }) {
  const entry = {
    service,
    method: method || 'POST',
    url,
    requestHeaders: sanitizeObject(requestHeaders),
    requestBody: sanitizeObject(requestBody),
    rawResponse: null,
    parsedResponse: null,
    statusCode: null,
    durationMs: null,
    error: null,
  };
  const startTime = Date.now();

  function finalize({ statusCode, rawResponse, parsedResponse, error } = {}) {
    entry.durationMs = Date.now() - startTime;
    entry.statusCode = statusCode || null;
    entry.rawResponse = rawResponse ?? null;
    entry.parsedResponse = parsedResponse ?? null;
    entry.error = error || null;

    ApiLog.create(entry).then(() => {
      return ApiLog.countDocuments();
    }).then((count) => {
      if (count > MAX_DB_ENTRIES) {
        const excess = count - MAX_DB_ENTRIES;
        return ApiLog.find({}).sort({ createdAt: 1 }).limit(excess).select('_id').then(docs => {
          const ids = docs.map(d => d._id);
          return ApiLog.deleteMany({ _id: { $in: ids } });
        });
      }
    }).catch(err => {
      console.error('[apiLogger] Failed to persist log to MongoDB:', err.message);
    });
  }

  return { entry, finalize };
}

export async function getApiLogs(limit = 50, offset = 0, service = null) {
  try {
    const filter = service ? { service } : {};
    const [total, logs] = await Promise.all([
      ApiLog.countDocuments(filter),
      ApiLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    const formatted = logs.map((log, idx) => ({
      id: log._id,
      timestamp: log.createdAt,
      service: log.service,
      method: log.method,
      url: log.url,
      requestHeaders: log.requestHeaders,
      requestBody: log.requestBody,
      rawResponse: log.rawResponse,
      parsedResponse: log.parsedResponse,
      statusCode: log.statusCode,
      durationMs: log.durationMs,
      error: log.error,
    }));

    return { total, logs: formatted, limit, offset };
  } catch (err) {
    console.error('[apiLogger] Failed to read logs from MongoDB:', err.message);
    return { total: 0, logs: [], limit, offset };
  }
}

export async function clearApiLogs() {
  try {
    const result = await ApiLog.deleteMany({});
    return { cleared: result.deletedCount };
  } catch (err) {
    console.error('[apiLogger] Failed to clear logs in MongoDB:', err.message);
    return { cleared: 0 };
  }
}
