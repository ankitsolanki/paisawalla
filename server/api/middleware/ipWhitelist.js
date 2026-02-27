import { logger } from '../utils/logger.js';

function getWhitelistedIPs() {
  const raw = process.env.ADMIN_IP_WHITELIST;
  if (!raw || raw.trim() === '') {
    return null;
  }
  return raw.split(',').map((ip) => ip.trim()).filter(Boolean);
}

export function ipWhitelist(req, res, next) {
  const allowedIPs = getWhitelistedIPs();

  if (!allowedIPs) {
    logger.error('[IP Whitelist] ADMIN_IP_WHITELIST environment variable is not set. Blocking all admin requests.', {
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access is not configured.',
    });
  }

  const clientIP = req.ip || req.connection?.remoteAddress || '';

  if (!allowedIPs.includes(clientIP)) {
    logger.warn('[IP Whitelist] Blocked unauthorized admin request', {
      clientIP,
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  next();
}
