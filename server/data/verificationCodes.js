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
  codes.set(email, {
    code,
    payload,
    expiresAt: Date.now() + EXPIRES_MS
  });
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

module.exports = { storeCode, verifyCode };
