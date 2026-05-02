const codes = new Map();

const EXPIRES_MS = 5 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [email, entry] of codes) {
    if (now >= entry.expiresAt) {
      codes.delete(email);
    }
  }
}

function storeCode(email, code, payload) {
  cleanup();
  const key = email.trim().toLowerCase();
  const existing = codes.get(key);
  if (existing && Date.now() < existing.expiresAt) {
    return false;
  }
  codes.set(key, {
    code: code.trim(),
    payload,
    expiresAt: Date.now() + EXPIRES_MS
  });
  return true;
}

function forceStoreCode(email, code, payload) {
  cleanup();
  const key = email.trim().toLowerCase();
  codes.set(key, {
    code: code.trim(),
    payload,
    expiresAt: Date.now() + EXPIRES_MS
  });
  return true;
}

function verifyCode(email, code) {
  const key = email.trim().toLowerCase();
  const inputCode = code.trim();
  const entry = codes.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    codes.delete(key);
    return null;
  }
  if (entry.code !== inputCode) return null;
  const payload = entry.payload;
  codes.delete(key);
  return payload;
}

module.exports = { storeCode, forceStoreCode, verifyCode };
