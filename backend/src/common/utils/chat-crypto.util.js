const crypto = require('crypto');
const config = require('../../config/env');

// Dinh danh phien ban payload ma hoa de ho tro nang cap sau nay.
const ENCRYPTION_PREFIX = 'enc:v1';
// AES-GCM khuyen nghi nonce/iv 12 byte.
const IV_LENGTH_BYTES = 12;

function buildCipherKey() {
  const rawKey = String(config.chat?.encryptionKey || '').trim();

  if (!rawKey) {
    throw new Error('Thiếu khóa mã hóa chat');
  }

  // Chuan hoa khoa ve 32 byte on dinh de dung cho AES-256.
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest();
}

function encryptChatContent(plainText) {
  // Luu du lieu theo format: enc:v1:iv:authTag:ciphertext
  const text = String(plainText || '');
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const key = buildCipherKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
}

function decryptChatContent(payload) {
  const value = String(payload || '');

  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    // Tuong thich nguoc: ban ghi cu chua ma hoa van doc duoc.
    return value;
  }

  const encodedPayload = value.slice(`${ENCRYPTION_PREFIX}:`.length);
  const parts = encodedPayload.split(':');
  if (parts.length !== 3 || parts.some(part => !part)) {
    throw new Error('Định dạng dữ liệu chat mã hóa không hợp lệ');
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const key = buildCipherKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = {
  encryptChatContent,
  decryptChatContent
};
