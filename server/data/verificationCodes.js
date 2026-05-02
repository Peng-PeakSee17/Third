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
  const existing = codes.get(email);
  if (existing && Date.now() < existing.expiresAt) {
    return false;
  }
  codes.set(email, {
    code,
    payload,
    expiresAt: Date.now() + EXPIRES_MS
  });
  return true;
}

function forceStoreCode(email, code, payload) {
  cleanup();
  codes.set(email, {
    code,
    payload,
    expiresAt: Date.now() + EXPIRES_MS
  });
  return true;
}

function verifyCode(email, code) {
  const entry = codes.get(email);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    codes.delete(email);
    return null;
  }
  if (entry.code !== code) return null;
  const payload = entry.payload;
  codes.delete(email);
  return payload;
}

module.exports = { storeCode, forceStoreCode, verifyCode };
