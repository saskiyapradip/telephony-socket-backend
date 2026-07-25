import crypto from 'crypto';

/**
 * Encrypt plaintext with AES-256-CBC (PKCS#5/PKCS#7 padding).
 * @param plaintext UTF-8 string or Buffer.
 * @param key 32-byte key.
 * @param iv 16-byte IV.
 * @returns Base64 ciphertext and Base64 IV.
 */
export function encrypt(
  plaintext: string,
  cid:string
) {
    let cidKey = `${cid}${cid}`;
    const keyUtf8 = cidKey.substring(0,32) // length = 32 chars
    const key = Buffer.from(keyUtf8, "utf8");

    // Your custom 16-byte IV
    const ivUtf8 = cidKey.substring(0,16); // length = 16 chars
    const iv = Buffer.from(ivUtf8, "utf8");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ct.toString("base64");
}

/**
 * Decrypt Base64 ciphertext with AES-256-CBC (PKCS#5/PKCS#7 padding).
 * @param ciphertextB64 Base64 ciphertext.
 * @param key 32-byte key.
 * @param iv 16-byte IV used for encryption.
 * @returns UTF-8 plaintext.
 */
export function decrypt(ciphertextB64: string,cid:String): string {

    let cidKey = `${cid}${cid}`;
    const keyUtf8 = cidKey.substring(0,32) // length = 32 chars
    const key = Buffer.from(keyUtf8, "utf8");

    // Your custom 16-byte IV
    const ivUtf8 = cidKey.substring(0,16); // length = 16 chars
    const iv = Buffer.from(ivUtf8, "utf8");
    
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const pt = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]);
  return pt.toString("utf8");
}
