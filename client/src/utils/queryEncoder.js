/**
 * Query Parameter Encoder/Decoder
 * 
 * Encodes and decodes authentication parameters (phone, authenticated status)
 * using base64 encoding with obfuscation to hide params from users in URL.
 * Also persists auth state in sessionStorage for cross-page persistence.
 */

const AUTH_STORAGE_KEY = 'pw_auth_data';
const AUTH_SESSION_EXPIRY_MS = 30 * 60 * 1000;

const CHAR_MAP = {
  'A': 'Z', 'B': 'Y', 'C': 'X', 'D': 'W', 'E': 'V',
  'F': 'U', 'G': 'T', 'H': 'S', 'I': 'R', 'J': 'Q',
  'K': 'P', 'L': 'O', 'M': 'N', 'N': 'M', 'O': 'L',
  'P': 'K', 'Q': 'J', 'R': 'I', 'S': 'H', 'T': 'G',
  'U': 'F', 'V': 'E', 'W': 'D', 'X': 'C', 'Y': 'B', 'Z': 'A',
  'a': 'z', 'b': 'y', 'c': 'x', 'd': 'w', 'e': 'v',
  'f': 'u', 'g': 't', 'h': 's', 'i': 'r', 'j': 'q',
  'k': 'p', 'l': 'o', 'm': 'n', 'n': 'm', 'o': 'l',
  'p': 'k', 'q': 'j', 'r': 'i', 's': 'h', 't': 'g',
  'u': 'f', 'v': 'e', 'w': 'd', 'x': 'c', 'y': 'b', 'z': 'a',
  '0': '9', '1': '8', '2': '7', '3': '6', '4': '5',
  '5': '4', '6': '3', '7': '2', '8': '1', '9': '0',
  '+': '-', '/': '_', '=': '.'
};

const REVERSE_CHAR_MAP = Object.fromEntries(
  Object.entries(CHAR_MAP).map(([k, v]) => [v, k])
);

function obfuscate(str) {
  return str.split('').map(char => CHAR_MAP[char] || char).join('');
}

function deobfuscate(str) {
  return str.split('').map(char => REVERSE_CHAR_MAP[char] || char).join('');
}

function saveAuthToSession(payload) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // silent — sessionStorage may be blocked in some contexts
  }
}

function getAuthFromSession() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    if (!payload || !payload.phone || !payload.authenticated) return null;

    if (!payload.timestamp || (Date.now() - payload.timestamp) > AUTH_SESSION_EXPIRY_MS) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      phone: payload.phone,
      authenticated: payload.authenticated,
      ...(payload.consentA !== undefined && {
        consentA: payload.consentA,
        consentB: payload.consentB,
        consentC: payload.consentC,
      }),
    };
  } catch (e) {
    return null;
  }
}

export function clearAuthSession() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    // silent
  }
}

/**
 * Encode authentication parameters
 * @param {string} phone - Phone number
 * @param {boolean} authenticated - Authentication status
 * @param {object} [consents] - Optional consent choices { consentA, consentB, consentC }
 * @returns {string} Encoded query parameter string
 */
export function encodeAuthParams(phone, authenticated, consents) {
  try {
    const payload = {
      phone: phone || '',
      authenticated: authenticated === true,
      timestamp: Date.now(),
    };

    if (consents) {
      payload.consentA = !!consents.consentA;
      payload.consentB = !!consents.consentB;
      payload.consentC = !!consents.consentC;
    }

    if (authenticated && phone) {
      saveAuthToSession(payload);
    }

    const jsonString = JSON.stringify(payload);
    const base64String = btoa(unescape(encodeURIComponent(jsonString)));
    const obfuscated = obfuscate(base64String);

    return obfuscated;
  } catch (error) {
    console.error('Error encoding auth params:', error);
    return '';
  }
}

/**
 * Decode authentication parameters from URL
 * @param {string} encodedString - Encoded query parameter value
 * @returns {object|null} Decoded object with phone and authenticated, or null if invalid
 */
export function decodeAuthParams(encodedString) {
  try {
    if (!encodedString || typeof encodedString !== 'string') {
      return null;
    }

    const deobfuscated = deobfuscate(encodedString);
    const jsonString = decodeURIComponent(escape(atob(deobfuscated)));
    const payload = JSON.parse(jsonString);

    if (!payload || typeof payload.phone !== 'string' || typeof payload.authenticated !== 'boolean') {
      return null;
    }

    return {
      phone: payload.phone,
      authenticated: payload.authenticated,
      ...(payload.consentA !== undefined && {
        consentA: payload.consentA,
        consentB: payload.consentB,
        consentC: payload.consentC,
      }),
    };
  } catch (error) {
    console.error('Error decoding auth params:', error);
    return null;
  }
}

/**
 * Extract and decode auth params from current URL, with sessionStorage fallback
 * @param {string} paramName - Query parameter name (default: 'auth')
 * @returns {object|null} Decoded auth params or null
 */
export function getAuthParamsFromUrl(paramName = 'auth') {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedValue = urlParams.get(paramName);
    
    if (encodedValue) {
      const decoded = decodeAuthParams(encodedValue);
      if (decoded && decoded.authenticated && decoded.phone) {
        saveAuthToSession({
          phone: decoded.phone,
          authenticated: decoded.authenticated,
          timestamp: Date.now(),
          ...(decoded.consentA !== undefined && {
            consentA: decoded.consentA,
            consentB: decoded.consentB,
            consentC: decoded.consentC,
          }),
        });
        return decoded;
      }
      return decoded;
    }

    const sessionAuth = getAuthFromSession();
    if (sessionAuth) {
      return sessionAuth;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth params from URL:', error);
    return null;
  }
}

/**
 * Build URL with encoded auth params
 * @param {string} baseUrl - Base URL
 * @param {string} phone - Phone number
 * @param {boolean} authenticated - Authentication status
 * @param {object} [consents] - Optional consent choices { consentA, consentB, consentC }
 * @param {string} [paramName] - Query parameter name (default: 'auth')
 * @returns {string} URL with encoded auth params
 */
export function buildUrlWithAuthParams(baseUrl, phone, authenticated, consents, paramName = 'auth') {
  const encoded = encodeAuthParams(phone, authenticated, consents);
  if (!encoded) {
    return baseUrl;
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set(paramName, encoded);
  return url.toString();
}
