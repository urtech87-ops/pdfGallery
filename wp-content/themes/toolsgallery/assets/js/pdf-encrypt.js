require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * AES-256 cryptographic utilities for PDF encryption (R=6)
 * Uses Web Crypto API — works in browsers, Cloudflare Workers, Deno, Node 18+
 *
 * @author PDFSmaller.com (https://pdfsmaller.com)
 * @license MIT
 *
 * Implements Algorithm 2.B from ISO 32000-2:2020
 * Verified against mozilla/pdf.js (the reference implementation)
 */

/**
 * Concatenate multiple Uint8Arrays
 */
function concat(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ========== SHA Hash Functions (Web Crypto) ==========

async function sha256(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

async function sha384(data) {
  const hash = await crypto.subtle.digest('SHA-384', data);
  return new Uint8Array(hash);
}

async function sha512(data) {
  const hash = await crypto.subtle.digest('SHA-512', data);
  return new Uint8Array(hash);
}

// ========== AES Encryption (Web Crypto) ==========

/**
 * AES-128-CBC encrypt (for Algorithm 2.B intermediate step)
 * Strips PKCS#7 padding since input is always block-aligned
 */
async function aes128CbcEncrypt(data, key, iv) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);
  // Strip PKCS#7 padding block (data is always block-aligned in Algorithm 2.B)
  return new Uint8Array(encrypted).slice(0, data.byteLength);
}

/**
 * AES-256-CBC encrypt with PKCS#7 padding (for per-object encryption)
 * Returns full ciphertext including padding
 */
async function aes256CbcEncrypt(data, key, iv) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);
  return new Uint8Array(encrypted);
}

/**
 * AES-256-CBC encrypt, strip padding (for UE, OE where input is block-aligned)
 */
async function aes256CbcEncryptNoPad(data, key, iv) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);
  return new Uint8Array(encrypted).slice(0, data.byteLength);
}

/**
 * AES-256-ECB encrypt a single 16-byte block (for Perms computation)
 * Uses CBC with zero IV — identical to ECB for a single block
 */
async function aes256EcbEncryptBlock(block, key) {
  const iv = new Uint8Array(16); // zero IV
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, block);
  return new Uint8Array(encrypted).slice(0, 16);
}

/**
 * Import an AES-256 key for reuse across multiple encrypt operations
 */
async function importAES256Key(key) {
  return await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
}

/**
 * AES-256-CBC encrypt using a pre-imported CryptoKey (for per-object encryption)
 */
async function aes256CbcEncryptWithKey(data, cryptoKey, iv) {
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);
  return new Uint8Array(encrypted);
}

// ========== Algorithm 2.B (ISO 32000-2:2020) ==========

/**
 * Algorithm 2.B — Computing a hash for R=6
 *
 * This is the hardened key derivation function used by PDF 2.0 (AES-256).
 * Iterates SHA-256/384/512 + AES-128-CBC for at least 64 rounds.
 *
 * Verified against mozilla/pdf.js (PDF20._hash)
 *
 * @param {Uint8Array} password - UTF-8 password bytes (max 127)
 * @param {Uint8Array} salt - 8-byte salt
 * @param {Uint8Array} userKey - 48-byte U value (for owner ops) or empty
 * @returns {Promise<Uint8Array>} - 32-byte hash
 */
async function computeHash2B(password, salt, userKey) {
  // Step 1: Initial SHA-256 hash
  const input = concat(password, salt, userKey);
  let K = await sha256(input);

  // Step 2: Iterative loop (minimum 64 rounds)
  let i = 0;
  let E;

  while (true) {
    // Step 2a: K1 = (password + K + userKey) repeated 64 times
    const block = concat(password, K, userKey);
    const K1 = new Uint8Array(block.length * 64);
    for (let j = 0; j < 64; j++) {
      K1.set(block, j * block.length);
    }

    // Step 2b: AES-128-CBC encrypt K1
    // Key = K[0..15], IV = K[16..31]
    const aesKey = K.slice(0, 16);
    const aesIV = K.slice(16, 32);
    E = await aes128CbcEncrypt(K1, aesKey, aesIV);

    // Step 2c: Hash function selection
    // Sum first 16 bytes of E mod 3 (equivalent to 128-bit big-endian mod 3)
    let byteSum = 0;
    for (let j = 0; j < 16; j++) {
      byteSum += E[j];
    }
    const hashSelect = byteSum % 3;

    // Step 2d: Hash E with selected function
    if (hashSelect === 0) {
      K = await sha256(E);
    } else if (hashSelect === 1) {
      K = await sha384(E);
    } else {
      K = await sha512(E);
    }

    // Step 2e: Termination (per pdf.js: while i < 64 || E[-1] > i - 32)
    i++;
    if (i >= 64 && E[E.length - 1] <= i - 32) {
      break;
    }
  }

  return K.slice(0, 32);
}

module.exports = { sha256, sha384, sha512, aes128CbcEncrypt, aes256CbcEncrypt, aes256CbcEncryptNoPad, aes256EcbEncryptBlock, importAES256Key, aes256CbcEncryptWithKey, computeHash2B, concat };

},{}],2:[function(require,module,exports){
/**
 * pdf-encrypt-lite - Ultra-lightweight PDF encryption library
 * Powers PDFSmaller.com's PDF encryption tool
 * 
 * @author PDFSmaller.com (https://pdfsmaller.com)
 * @license MIT
 * @see https://pdfsmaller.com/protect-pdf - Try it online!
 * 
 * This minimal cryptographic implementation was built to solve the "impossible" 
 * problem of real PDF encryption within Cloudflare Workers' 1MB limit.
 * Total size: ~7KB for complete PDF encryption!
 */

// Minimal cryptographic functions for PDF encryption
// Implements only what's needed for PDF Standard Security Handler

/**
 * Minimal MD5 implementation
 * Based on the MD5 algorithm - only what's needed for PDF encryption
 * Part of PDFSmaller.com's ultra-lightweight encryption engine
 */
function md5(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  
  // Initialize MD5 constants
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ]);
  
  // Initialize hash values
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  
  // Pre-processing
  const msgLen = bytes.length;
  const msgBitLen = msgLen * 8;
  const msgLenPadded = ((msgLen + 9 + 63) & ~63);
  const msg = new Uint8Array(msgLenPadded);
  msg.set(bytes);
  msg[msgLen] = 0x80;
  
  // Append length in bits
  const dataView = new DataView(msg.buffer);
  dataView.setUint32(msgLenPadded - 8, msgBitLen, true);
  dataView.setUint32(msgLenPadded - 4, 0, true);
  
  // Process message in 512-bit chunks
  for (let offset = 0; offset < msgLenPadded; offset += 64) {
    const chunk = new Uint32Array(msg.buffer, offset, 16);
    
    let a = a0, b = b0, c = c0, d = d0;
    
    for (let i = 0; i < 64; i++) {
      let f, g;
      
      if (i < 16) {
        f = (b & c) | ((~b) & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | ((~d) & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | (~d));
        g = (7 * i) % 16;
      }
      
      f = (f + a + K[i] + chunk[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }
    
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  
  // Produce the final hash value
  const result = new Uint8Array(16);
  const view = new DataView(result.buffer);
  view.setUint32(0, a0, true);
  view.setUint32(4, b0, true);
  view.setUint32(8, c0, true);
  view.setUint32(12, d0, true);
  
  return result;
}

/**
 * RC4 encryption/decryption
 * RC4 is symmetric, so encryption and decryption are the same operation
 * Part of PDFSmaller.com's ultra-lightweight encryption engine
 */
class RC4 {
  constructor(key) {
    this.s = new Uint8Array(256);
    this.i = 0;
    this.j = 0;
    
    // Key scheduling algorithm (KSA)
    for (let i = 0; i < 256; i++) {
      this.s[i] = i;
    }
    
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.s[i] + key[i % key.length]) & 0xFF;
      // Swap
      [this.s[i], this.s[j]] = [this.s[j], this.s[i]];
    }
  }
  
  /**
   * Encrypt/decrypt data
   * @param {Uint8Array} data - Data to encrypt or decrypt
   * @returns {Uint8Array} - Encrypted/decrypted data
   */
  process(data) {
    const result = new Uint8Array(data.length);
    
    for (let k = 0; k < data.length; k++) {
      this.i = (this.i + 1) & 0xFF;
      this.j = (this.j + this.s[this.i]) & 0xFF;
      
      // Swap
      [this.s[this.i], this.s[this.j]] = [this.s[this.j], this.s[this.i]];
      
      const t = (this.s[this.i] + this.s[this.j]) & 0xFF;
      result[k] = data[k] ^ this.s[t];
    }
    
    return result;
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
module.exports = { md5, RC4, hexToBytes, bytesToHex };

},{}],3:[function(require,module,exports){
const { encryptPDF } = require('./pdf-encrypt.js');
const { md5, RC4, hexToBytes, bytesToHex } = require('./crypto-rc4.js');
const { sha256, sha384, sha512, aes256CbcEncrypt, aes256CbcEncryptNoPad, aes256EcbEncryptBlock, computeHash2B, concat } = require('./crypto-aes.js');

module.exports = { encryptPDF, md5, RC4, hexToBytes, bytesToHex, sha256, sha384, sha512, aes256CbcEncrypt, aes256CbcEncryptNoPad, aes256EcbEncryptBlock, computeHash2B, concat };

},{"./crypto-aes.js":1,"./crypto-rc4.js":2,"./pdf-encrypt.js":4}],4:[function(require,module,exports){
/**
 * @pdfsmaller/pdf-encrypt — PDF encryption with AES-256 and RC4 support
 * Powers PDFSmaller.com's Protect PDF tool
 *
 * @author PDFSmaller.com (https://pdfsmaller.com)
 * @license MIT
 * @see https://pdfsmaller.com/protect-pdf - Try it online!
 *
 * Implements:
 *   - AES-256 (V=5, R=6) per ISO 32000-2:2020 — Algorithms 2.B, 8, 9, 10
 *   - RC4 128-bit (V=2, R=3) per ISO 32000-1:2008 — Algorithms 2, 3, 4
 *
 * Verified against mozilla/pdf.js and Adobe Acrobat
 */

const { PDFDocument, PDFName, PDFHexString, PDFString, PDFDict, PDFArray, PDFRawStream, PDFNumber } = require('pdf-lib');
const { md5, RC4, hexToBytes, bytesToHex } = require('./crypto-rc4.js');
const { sha256, sha384, sha512, aes256CbcEncrypt, aes256CbcEncryptNoPad, aes256EcbEncryptBlock, importAES256Key, aes256CbcEncryptWithKey, computeHash2B, concat } = require('./crypto-aes.js');

// ========== PDF Standard Padding (for RC4) ==========

const PADDING = new Uint8Array([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
]);

// ========== Permission Flags (ISO 32000-2 Table 22) ==========

const PERM_FLAGS = {
  PRINT:              0x00000004, // Bit 3
  MODIFY:             0x00000008, // Bit 4
  COPY:               0x00000010, // Bit 5
  ANNOTATE:           0x00000020, // Bit 6
  FILL_FORMS:         0x00000100, // Bit 9
  EXTRACT:            0x00000200, // Bit 10
  ASSEMBLE:           0x00000400, // Bit 11
  PRINT_HIGH_QUALITY: 0x00000800, // Bit 12
};

/**
 * Build 32-bit permission integer from options
 * Bits 1-2, 7-8, 13-32 must be set to 1 per spec
 */
function buildPermissions(options) {
  // Start with required bits set (1-2 set, 7-8 set, 13-32 set)
  let P = 0xFFFFF000 | 0x000000C0; // bits 13-32 + bits 7-8

  if (options.allowPrinting !== false) P |= PERM_FLAGS.PRINT;
  if (options.allowModifying !== false) P |= PERM_FLAGS.MODIFY;
  if (options.allowCopying !== false) P |= PERM_FLAGS.COPY;
  if (options.allowAnnotating !== false) P |= PERM_FLAGS.ANNOTATE;
  if (options.allowFillingForms !== false) P |= PERM_FLAGS.FILL_FORMS;
  if (options.allowExtraction !== false) P |= PERM_FLAGS.EXTRACT;
  if (options.allowAssembly !== false) P |= PERM_FLAGS.ASSEMBLE;
  if (options.allowHighQualityPrint !== false) P |= PERM_FLAGS.PRINT_HIGH_QUALITY;

  // Convert to signed 32-bit integer
  return P | 0;
}

// ========== RC4 Encryption (V=2, R=3) ==========

function padPassword(password) {
  const pwdBytes = new TextEncoder().encode(password);
  const padded = new Uint8Array(32);
  if (pwdBytes.length >= 32) {
    padded.set(pwdBytes.slice(0, 32));
  } else {
    padded.set(pwdBytes);
    padded.set(PADDING.slice(0, 32 - pwdBytes.length), pwdBytes.length);
  }
  return padded;
}

function computeEncryptionKeyRC4(userPassword, ownerKey, permissions, fileId) {
  const paddedPwd = padPassword(userPassword);
  const hashInput = new Uint8Array(paddedPwd.length + ownerKey.length + 4 + fileId.length);
  let offset = 0;
  hashInput.set(paddedPwd, offset); offset += paddedPwd.length;
  hashInput.set(ownerKey, offset); offset += ownerKey.length;
  hashInput[offset++] = permissions & 0xFF;
  hashInput[offset++] = (permissions >> 8) & 0xFF;
  hashInput[offset++] = (permissions >> 16) & 0xFF;
  hashInput[offset++] = (permissions >> 24) & 0xFF;
  hashInput.set(fileId, offset);
  let hash = md5(hashInput);
  for (let i = 0; i < 50; i++) {
    hash = md5(hash.slice(0, 16));
  }
  return hash.slice(0, 16);
}

function computeOwnerKeyRC4(ownerPassword, userPassword) {
  const paddedOwner = padPassword(ownerPassword || userPassword);
  let hash = md5(paddedOwner);
  for (let i = 0; i < 50; i++) {
    hash = md5(hash);
  }
  const paddedUser = padPassword(userPassword);
  let result = new Uint8Array(paddedUser);
  for (let i = 0; i < 20; i++) {
    const key = new Uint8Array(hash.length);
    for (let j = 0; j < hash.length; j++) {
      key[j] = hash[j] ^ i;
    }
    const rc4 = new RC4(key.slice(0, 16));
    result = rc4.process(result);
  }
  return result;
}

function computeUserKeyRC4(encryptionKey, fileId) {
  const hashInput = new Uint8Array(PADDING.length + fileId.length);
  hashInput.set(PADDING);
  hashInput.set(fileId, PADDING.length);
  const hash = md5(hashInput);
  const rc4 = new RC4(encryptionKey);
  let result = rc4.process(hash);
  for (let i = 1; i <= 19; i++) {
    const key = new Uint8Array(encryptionKey.length);
    for (let j = 0; j < encryptionKey.length; j++) {
      key[j] = encryptionKey[j] ^ i;
    }
    const rc4iter = new RC4(key);
    result = rc4iter.process(result);
  }
  const finalResult = new Uint8Array(32);
  finalResult.set(result);
  return finalResult;
}

function encryptObjectRC4(data, objectNum, generationNum, encryptionKey) {
  const keyInput = new Uint8Array(encryptionKey.length + 5);
  keyInput.set(encryptionKey);
  keyInput[encryptionKey.length] = objectNum & 0xFF;
  keyInput[encryptionKey.length + 1] = (objectNum >> 8) & 0xFF;
  keyInput[encryptionKey.length + 2] = (objectNum >> 16) & 0xFF;
  keyInput[encryptionKey.length + 3] = generationNum & 0xFF;
  keyInput[encryptionKey.length + 4] = (generationNum >> 8) & 0xFF;
  const objectKey = md5(keyInput);
  const rc4 = new RC4(objectKey.slice(0, Math.min(encryptionKey.length + 5, 16)));
  return rc4.process(data);
}

// ========== AES-256 Encryption (V=5, R=6) ==========

/**
 * Truncate password to 127 bytes (UTF-8) per PDF 2.0 spec
 */
function saslPrepPassword(password) {
  const bytes = new TextEncoder().encode(password);
  return bytes.length > 127 ? bytes.slice(0, 127) : bytes;
}

/**
 * Generate cryptographically random bytes
 */
function randomBytes(n) {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Algorithm 8 — Computing U and UE (ISO 32000-2:2020)
 *
 * @param {Uint8Array} password - UTF-8 password bytes (max 127)
 * @param {Uint8Array} fileKey - 32-byte random file encryption key
 * @returns {Promise<{U: Uint8Array, UE: Uint8Array}>}
 */
async function computeUandUE(password, fileKey) {
  // Generate random validation salt (8 bytes) and key salt (8 bytes)
  const validationSalt = randomBytes(8);
  const keySalt = randomBytes(8);

  // U = hash(password, validationSalt) + validationSalt + keySalt
  const hash = await computeHash2B(password, validationSalt, new Uint8Array(0));
  const U = new Uint8Array(48);
  U.set(hash, 0);          // 32-byte hash
  U.set(validationSalt, 32); // 8-byte validation salt
  U.set(keySalt, 40);       // 8-byte key salt

  // UE = AES-256-CBC(fileKey, key=hash2B(password, keySalt), iv=zero)
  const ueKey = await computeHash2B(password, keySalt, new Uint8Array(0));
  const zeroIV = new Uint8Array(16);
  const UE = await aes256CbcEncryptNoPad(fileKey, ueKey, zeroIV);

  return { U, UE };
}

/**
 * Algorithm 9 — Computing O and OE (ISO 32000-2:2020)
 *
 * @param {Uint8Array} password - Owner password bytes (max 127)
 * @param {Uint8Array} fileKey - 32-byte random file encryption key
 * @param {Uint8Array} U - 48-byte U value (from Algorithm 8)
 * @returns {Promise<{O: Uint8Array, OE: Uint8Array}>}
 */
async function computeOandOE(password, fileKey, U) {
  const validationSalt = randomBytes(8);
  const keySalt = randomBytes(8);

  // O = hash(password, validationSalt, U) + validationSalt + keySalt
  const hash = await computeHash2B(password, validationSalt, U);
  const O = new Uint8Array(48);
  O.set(hash, 0);
  O.set(validationSalt, 32);
  O.set(keySalt, 40);

  // OE = AES-256-CBC(fileKey, key=hash2B(password, keySalt, U), iv=zero)
  const oeKey = await computeHash2B(password, keySalt, U);
  const zeroIV = new Uint8Array(16);
  const OE = await aes256CbcEncryptNoPad(fileKey, oeKey, zeroIV);

  return { O, OE };
}

/**
 * Algorithm 10 — Computing Perms (ISO 32000-2:2020)
 *
 * @param {number} permissions - 32-bit permission flags
 * @param {Uint8Array} fileKey - 32-byte file encryption key
 * @param {boolean} encryptMetadata - Whether metadata is encrypted
 * @returns {Promise<Uint8Array>} - 16-byte Perms value
 */
async function computePerms(permissions, fileKey, encryptMetadata) {
  const block = new Uint8Array(16);

  // Bytes 0-3: permissions (little-endian)
  block[0] = permissions & 0xFF;
  block[1] = (permissions >> 8) & 0xFF;
  block[2] = (permissions >> 16) & 0xFF;
  block[3] = (permissions >> 24) & 0xFF;

  // Bytes 4-7: 0xFFFFFFFF (per spec)
  block[4] = 0xFF;
  block[5] = 0xFF;
  block[6] = 0xFF;
  block[7] = 0xFF;

  // Byte 8: 'T' or 'F' for EncryptMetadata
  block[8] = encryptMetadata ? 0x54 : 0x46; // 'T' or 'F'

  // Bytes 9-11: 'a', 'd', 'b' (per spec)
  block[9] = 0x61;  // 'a'
  block[10] = 0x64; // 'd'
  block[11] = 0x62; // 'b'

  // Bytes 12-15: random data
  const rand = randomBytes(4);
  block[12] = rand[0];
  block[13] = rand[1];
  block[14] = rand[2];
  block[15] = rand[3];

  // AES-256-ECB encrypt
  return await aes256EcbEncryptBlock(block, fileKey);
}

/**
 * Encrypt data for a specific object using AES-256-CBC
 * Per PDF 2.0: file encryption key used directly (no per-object derivation)
 * Random 16-byte IV prepended to ciphertext
 */
async function encryptObjectAES256(data, cryptoKey) {
  const iv = randomBytes(16);
  const encrypted = await aes256CbcEncryptWithKey(data, cryptoKey, iv);
  // Prepend IV to ciphertext (PDF spec requirement)
  const result = new Uint8Array(16 + encrypted.length);
  result.set(iv, 0);
  result.set(encrypted, 16);
  return result;
}

// ========== String/Object Encryption ==========

/**
 * Recursively encrypt strings in a PDF object (RC4 mode)
 */
function encryptStringsRC4(obj, objectNum, generationNum, encryptionKey) {
  if (!obj) return;

  if (obj instanceof PDFString) {
    const originalBytes = obj.asBytes();
    const encrypted = encryptObjectRC4(originalBytes, objectNum, generationNum, encryptionKey);
    obj.value = Array.from(encrypted).map(b => String.fromCharCode(b)).join('');
  } else if (obj instanceof PDFHexString) {
    const originalBytes = obj.asBytes();
    const encrypted = encryptObjectRC4(originalBytes, objectNum, generationNum, encryptionKey);
    obj.value = bytesToHex(encrypted);
  } else if (obj instanceof PDFDict) {
    for (const [key, value] of obj.entries()) {
      const keyName = key.asString();
      if (keyName !== '/Length' && keyName !== '/Filter' && keyName !== '/DecodeParms') {
        encryptStringsRC4(value, objectNum, generationNum, encryptionKey);
      }
    }
  } else if (obj instanceof PDFArray) {
    for (const element of obj.asArray()) {
      encryptStringsRC4(element, objectNum, generationNum, encryptionKey);
    }
  }
}

/**
 * Recursively encrypt strings in a PDF object (AES-256 mode)
 * For AES-256, strings get AES-256-CBC with random IV prepended
 */
async function encryptStringsAES256(obj, objectNum, generationNum, cryptoKey) {
  if (!obj) return;

  if (obj instanceof PDFString) {
    const originalBytes = obj.asBytes();
    const encrypted = await encryptObjectAES256(originalBytes, cryptoKey);
    obj.value = Array.from(encrypted).map(b => String.fromCharCode(b)).join('');
  } else if (obj instanceof PDFHexString) {
    const originalBytes = obj.asBytes();
    const encrypted = await encryptObjectAES256(originalBytes, cryptoKey);
    obj.value = bytesToHex(encrypted);
  } else if (obj instanceof PDFDict) {
    for (const [key, value] of obj.entries()) {
      const keyName = key.asString();
      if (keyName !== '/Length' && keyName !== '/Filter' && keyName !== '/DecodeParms') {
        await encryptStringsAES256(value, objectNum, generationNum, cryptoKey);
      }
    }
  } else if (obj instanceof PDFArray) {
    for (const element of obj.asArray()) {
      await encryptStringsAES256(element, objectNum, generationNum, cryptoKey);
    }
  }
}

// ========== Main Encryption Function ==========

/**
 * Encrypt a PDF with password protection
 *
 * @param {Uint8Array} pdfBytes - The PDF file as bytes
 * @param {string} userPassword - Password required to open the PDF
 * @param {Object} [options] - Encryption options
 * @param {string} [options.ownerPassword] - Owner password (defaults to userPassword)
 * @param {'AES-256'|'RC4'} [options.algorithm='AES-256'] - Encryption algorithm
 * @param {boolean} [options.allowPrinting=true] - Allow printing
 * @param {boolean} [options.allowModifying=true] - Allow modification
 * @param {boolean} [options.allowCopying=true] - Allow copying text
 * @param {boolean} [options.allowAnnotating=true] - Allow annotations
 * @param {boolean} [options.allowFillingForms=true] - Allow form filling
 * @param {boolean} [options.allowExtraction=true] - Allow accessibility extraction
 * @param {boolean} [options.allowAssembly=true] - Allow document assembly
 * @param {boolean} [options.allowHighQualityPrint=true] - Allow high-quality printing
 * @returns {Promise<Uint8Array>} - The encrypted PDF bytes
 *
 * @example
 * // AES-256 (default, recommended)
 * const encrypted = await encryptPDF(pdfBytes, 'secret123');
 *
 * // With owner password and restricted permissions
 * const encrypted = await encryptPDF(pdfBytes, 'user', {
 *   ownerPassword: 'owner',
 *   allowPrinting: true,
 *   allowCopying: false,
 *   allowModifying: false
 * });
 *
 * // RC4 legacy mode
 * const encrypted = await encryptPDF(pdfBytes, 'password', { algorithm: 'RC4' });
 */
async function encryptPDF(pdfBytes, userPassword, options = {}) {
  const algorithm = options.algorithm || 'AES-256';
  const ownerPassword = options.ownerPassword || userPassword;

  if (algorithm === 'AES-256') {
    return encryptPDF_AES256(pdfBytes, userPassword, ownerPassword, options);
  } else if (algorithm === 'RC4') {
    return encryptPDF_RC4(pdfBytes, userPassword, ownerPassword, options);
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}. Use 'AES-256' or 'RC4'.`);
  }
}

// ========== AES-256 Encryption (V=5, R=6) ==========

async function encryptPDF_AES256(pdfBytes, userPassword, ownerPassword, options) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    const context = pdfDoc.context;
    const permissions = buildPermissions(options);

    // Generate file ID
    let fileId = getOrCreateFileId(context);

    // Generate random 32-byte file encryption key
    const fileKey = randomBytes(32);

    // Prepare password bytes
    const userPwdBytes = saslPrepPassword(userPassword);
    const ownerPwdBytes = saslPrepPassword(ownerPassword);

    // Algorithm 8: Compute U and UE
    const { U, UE } = await computeUandUE(userPwdBytes, fileKey);

    // Algorithm 9: Compute O and OE
    const { O, OE } = await computeOandOE(ownerPwdBytes, fileKey, U);

    // Algorithm 10: Compute Perms
    const Perms = await computePerms(permissions, fileKey, true);

    // Import AES key for reuse across all object encryptions
    const cryptoKey = await importAES256Key(fileKey);

    // Encrypt all objects
    const indirectObjects = context.enumerateIndirectObjects();

    for (const [ref, obj] of indirectObjects) {
      const objectNum = ref.objectNumber;
      const generationNum = ref.generationNumber || 0;

      // Skip encryption dictionary
      if (obj instanceof PDFDict) {
        const filter = obj.get(PDFName.of('Filter'));
        if (filter && filter.asString() === '/Standard') continue;
      }

      // Skip XRef and Sig streams
      if (obj instanceof PDFRawStream && obj.dict) {
        const type = obj.dict.get(PDFName.of('Type'));
        if (type) {
          const typeName = type.toString();
          if (typeName === '/XRef' || typeName === '/Sig') continue;
        }
      }

      // Encrypt streams
      if (obj instanceof PDFRawStream) {
        const streamData = obj.contents;
        const encrypted = await encryptObjectAES256(streamData, cryptoKey);
        obj.contents = encrypted;

        // Encrypt strings in stream dictionary
        if (obj.dict) {
          await encryptStringsAES256(obj.dict, objectNum, generationNum, cryptoKey);
        }
      }

      // Encrypt strings in non-stream objects
      if (!(obj instanceof PDFRawStream)) {
        await encryptStringsAES256(obj, objectNum, generationNum, cryptoKey);
      }
    }

    // Build the encryption dictionary for AES-256
    // StdCF crypt filter
    const stdCF = context.obj({
      Type: PDFName.of('CryptFilter'),
      CFM: PDFName.of('AESV3'),
      Length: PDFNumber.of(32),
      AuthEvent: PDFName.of('DocOpen'),
    });

    const cfDict = context.obj({});
    cfDict.set(PDFName.of('StdCF'), stdCF);

    const encryptDict = context.obj({
      Filter: PDFName.of('Standard'),
      V: PDFNumber.of(5),
      R: PDFNumber.of(6),
      Length: PDFNumber.of(256),
      P: PDFNumber.of(permissions),
      O: PDFHexString.of(bytesToHex(O)),
      U: PDFHexString.of(bytesToHex(U)),
      OE: PDFHexString.of(bytesToHex(OE)),
      UE: PDFHexString.of(bytesToHex(UE)),
      Perms: PDFHexString.of(bytesToHex(Perms)),
      StmF: PDFName.of('StdCF'),
      StrF: PDFName.of('StdCF'),
      CF: cfDict,
    });

    // EncryptMetadata: true (default, we always encrypt metadata)
    encryptDict.set(PDFName.of('EncryptMetadata'), context.obj(true));

    const encryptRef = context.register(encryptDict);

    // Update trailer
    const trailer = context.trailerInfo;
    trailer.Encrypt = encryptRef;

    // Ensure file ID is in trailer
    if (!trailer.ID) {
      const idHex1 = PDFHexString.of(bytesToHex(fileId));
      const idHex2 = PDFHexString.of(bytesToHex(fileId));
      trailer.ID = [idHex1, idHex2];
    }

    const encryptedBytes = await pdfDoc.save({ useObjectStreams: false });
    return encryptedBytes;

  } catch (error) {
    if (error.message && error.message.startsWith('Unsupported')) throw error;
    throw new Error(`Failed to encrypt PDF (AES-256): ${error.message}`);
  }
}

// ========== RC4 Encryption (V=2, R=3) ==========

async function encryptPDF_RC4(pdfBytes, userPassword, ownerPassword, options) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    const context = pdfDoc.context;
    const permissions = buildPermissions(options);

    let fileId = getOrCreateFileId(context);

    // Compute O (owner) key
    const ownerKey = computeOwnerKeyRC4(ownerPassword, userPassword);

    // Compute encryption key
    const encryptionKey = computeEncryptionKeyRC4(userPassword, ownerKey, permissions, fileId);

    // Compute U (user) key
    const userKey = computeUserKeyRC4(encryptionKey, fileId);

    // Encrypt all objects
    const indirectObjects = context.enumerateIndirectObjects();

    for (const [ref, obj] of indirectObjects) {
      const objectNum = ref.objectNumber;
      const generationNum = ref.generationNumber || 0;

      if (obj instanceof PDFDict) {
        const filter = obj.get(PDFName.of('Filter'));
        if (filter && filter.asString() === '/Standard') continue;
      }

      if (obj instanceof PDFRawStream && obj.dict) {
        const type = obj.dict.get(PDFName.of('Type'));
        if (type) {
          const typeName = type.toString();
          if (typeName === '/XRef' || typeName === '/Sig') continue;
        }
      }

      if (obj instanceof PDFRawStream) {
        const streamData = obj.contents;
        const encrypted = encryptObjectRC4(streamData, objectNum, generationNum, encryptionKey);
        obj.contents = encrypted;

        if (obj.dict) {
          encryptStringsRC4(obj.dict, objectNum, generationNum, encryptionKey);
        }
      }

      if (!(obj instanceof PDFRawStream)) {
        encryptStringsRC4(obj, objectNum, generationNum, encryptionKey);
      }
    }

    const encryptDict = context.obj({
      Filter: PDFName.of('Standard'),
      V: PDFNumber.of(2),
      R: PDFNumber.of(3),
      Length: PDFNumber.of(128),
      P: PDFNumber.of(permissions),
      O: PDFHexString.of(bytesToHex(ownerKey)),
      U: PDFHexString.of(bytesToHex(userKey)),
    });

    const encryptRef = context.register(encryptDict);

    const trailer = context.trailerInfo;
    trailer.Encrypt = encryptRef;

    if (!trailer.ID) {
      const idHex1 = PDFHexString.of(bytesToHex(fileId));
      const idHex2 = PDFHexString.of(bytesToHex(fileId));
      trailer.ID = [idHex1, idHex2];
    }

    const encryptedBytes = await pdfDoc.save({ useObjectStreams: false });
    return encryptedBytes;

  } catch (error) {
    throw new Error(`Failed to encrypt PDF (RC4): ${error.message}`);
  }
}

// ========== Helpers ==========

/**
 * Get existing file ID from trailer or generate a new one
 */
function getOrCreateFileId(context) {
  const trailer = context.trailerInfo;
  const idArray = trailer.ID;

  if (idArray && Array.isArray(idArray) && idArray.length > 0) {
    const idString = idArray[0].toString();
    const hexStr = idString.replace(/^<|>$/g, '');
    return hexToBytes(hexStr);
  }

  // Generate new file ID
  const fileId = randomBytes(16);
  const idHex1 = PDFHexString.of(bytesToHex(fileId));
  const idHex2 = PDFHexString.of(bytesToHex(fileId));
  trailer.ID = [idHex1, idHex2];
  return fileId;
}

module.exports = { encryptPDF };

},{"./crypto-aes.js":1,"./crypto-rc4.js":2,"pdf-lib":"pdf-lib"}],5:[function(require,module,exports){
// Shim pdf-lib to use the globally loaded CDN version
if (typeof window !== 'undefined' && window.PDFLib && typeof require !== 'undefined') {
  // handled by browserify shim below
}
const pdfEncryptLib = require('@pdfsmaller/pdf-encrypt');
window.pdfEncryptLib = pdfEncryptLib;

},{"@pdfsmaller/pdf-encrypt":3}],"pdf-lib":[function(require,module,exports){
// In the browser, pdf-lib is loaded via CDN as window.PDFLib
module.exports = window.PDFLib;

},{}]},{},[5]);
