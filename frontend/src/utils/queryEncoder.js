/**
 * Query Parameter Encoder/Decoder
 * 
 * Encodes and decodes authentication parameters (phone, authenticated status)
 * using base64 encoding with obfuscation to hide params from users in URL.
 */

/**
 * Simple character mapping for obfuscation (A to B mapping)
 * This makes the encoded string less obvious
 */
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

/**
 * Obfuscate a string by mapping characters
 */
function obfuscate(str) {
  return str.split('').map(char => CHAR_MAP[char] || char).join('');
}

/**
 * De-obfuscate a string by reversing the character mapping
 */
function deobfuscate(str) {
  return str.split('').map(char => REVERSE_CHAR_MAP[char] || char).join('');
}

/**
 * Encode authentication parameters
 * @param {string} phone - Phone number
 * @param {boolean} authenticated - Authentication status
 * @returns {string} Encoded query parameter string
 */
export function encodeAuthParams(phone, authenticated) {
  try {
    // Create payload object
    const payload = {
      phone: phone || '',
      authenticated: authenticated === true,
      timestamp: Date.now(), // Add timestamp for potential expiry checks
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(payload);

    // Encode to base64
    const base64String = btoa(unescape(encodeURIComponent(jsonString)));

    // Obfuscate the base64 string
    const obfuscated = obfuscate(base64String);

    // Return as query parameter value (use a non-obvious param name)
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

    // De-obfuscate
    const deobfuscated = deobfuscate(encodedString);

    // Decode from base64
    const jsonString = decodeURIComponent(escape(atob(deobfuscated)));

    // Parse JSON
    const payload = JSON.parse(jsonString);

    // Validate payload structure
    if (!payload || typeof payload.phone !== 'string' || typeof payload.authenticated !== 'boolean') {
      return null;
    }

    // Optional: Check timestamp if you want to expire old auth tokens
    // const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    // if (Date.now() - payload.timestamp > MAX_AGE) {
    //   return null;
    // }

    return {
      phone: payload.phone,
      authenticated: payload.authenticated,
    };
  } catch (error) {
    console.error('Error decoding auth params:', error);
    return null;
  }
}

/**
 * Extract and decode auth params from current URL
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
    
    if (!encodedValue) {
      return null;
    }

    return decodeAuthParams(encodedValue);
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
 * @param {string} paramName - Query parameter name (default: 'auth')
 * @returns {string} URL with encoded auth params
 */
export function buildUrlWithAuthParams(baseUrl, phone, authenticated, paramName = 'auth') {
  const encoded = encodeAuthParams(phone, authenticated);
  if (!encoded) {
    return baseUrl;
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set(paramName, encoded);
  return url.toString();
}

