import crypto from 'crypto';

// NOTE: ciphertext format changed from a bare base64 string to
// "<ivHex>:<cipherBase64>". A random IV is now generated per call instead of
// being derived from the key (old code reused key bytes as the IV, which is
// deterministic and leaks plaintext patterns - identical messages always
// produced identical ciphertext).
// IMPORTANT: values encrypted with the OLD version of this file cannot be
// decrypted by this new version - they have no IV embedded. Existing
// encrypted DB fields need a migration (decrypt with the old fixed-IV logic,
// re-encrypt with this one) before this change ships.

/**
 * Encrypt plaintext with AES-256-CBC (PKCS#5/PKCS#7 padding).
 * @param plaintext UTF-8 string.
 * @param cid Key material (repeated/truncated to 32 bytes, as before).
 * @returns "<ivHex>:<cipherBase64>"
 */
export function encrypt(
  plaintext: string,
  cid: string
) {
  const cidKey = `${cid}${cid}`;
  const keyUtf8 = cidKey.substring(0, 32); // length = 32 chars
  const key = Buffer.from(keyUtf8, "utf8");

  const iv = crypto.randomBytes(16); // random IV per call
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${ct.toString("base64")}`;
}

/**
 * Decrypt ciphertext produced by encrypt() above.
 * @param ciphertext "<ivHex>:<cipherBase64>"
 * @param cid Key material (repeated/truncated to 32 bytes, as before).
 * @returns UTF-8 plaintext.
 */
export function decrypt(ciphertext: string, cid: string): string {
  const cidKey = `${cid}${cid}`;
  const keyUtf8 = cidKey.substring(0, 32); // length = 32 chars
  const key = Buffer.from(keyUtf8, "utf8");

  const [ivHex, ciphertextB64] = String(ciphertext).split(":");
  if (!ivHex || !ciphertextB64) {
    throw new Error("decrypt: malformed ciphertext (expected '<ivHex>:<cipherBase64>')");
  }
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const pt = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]);
  return pt.toString("utf8");
}
