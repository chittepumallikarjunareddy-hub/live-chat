/**
 * crypto.js — End-to-End Encryption module for SivionChat
 * Uses the Web Crypto API (ECDH + AES-GCM). Keys never leave the client.
 *
 * Flow:
 * 1. On first login: generateKeyPair() → export public key → register with server
 * 2. When opening a chat: deriveSharedSecret(theirPublicKey) → store in chatKeys Map
 * 3. Before sending: encrypt(text, sharedSecret) → send ciphertext
 * 4. On receive: decrypt(ciphertext, sharedSecret) → show plaintext
 */

const DB_NAME    = "sivionchat_e2ee";
const DB_VERSION = 1;
const STORE_NAME = "keys";

// In-memory cache of derived shared secrets per contact
const chatKeys = new Map();

// ── IndexedDB helpers ──────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbGet(key) {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbSet(key, value) {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Key Generation ─────────────────────────────────────────────

export async function generateKeyPair() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  // Persist private key to IndexedDB
  await dbSet("privateKey", pair.privateKey);
  // Export public key as JWK for sharing
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  await dbSet("publicKey", JSON.stringify(pub));
  return JSON.stringify(pub);
}

export async function getStoredPublicKey() {
  const raw = await dbGet("publicKey");
  return raw || null;
}

export async function hasKeyPair() {
  const priv = await dbGet("privateKey");
  return Boolean(priv);
}

// ── Shared Secret Derivation ───────────────────────────────────

export async function deriveSharedSecret(theirPublicKeyJwk) {
  try {
    const cached = chatKeys.get(theirPublicKeyJwk);
    if (cached) return cached;

    const privateKey = await dbGet("privateKey");
    if (!privateKey) return null;

    const theirPub = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(theirPublicKeyJwk),
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    const sharedKey = await crypto.subtle.deriveKey(
      { name: "ECDH", public: theirPub },
      privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    chatKeys.set(theirPublicKeyJwk, sharedKey);
    return sharedKey;
  } catch (err) {
    console.warn("E2EE deriveSharedSecret error:", err);
    return null;
  }
}

// ── Encrypt / Decrypt ──────────────────────────────────────────

export async function encryptMessage(plaintext, sharedKey) {
  if (!sharedKey) return plaintext; // Fallback: send unencrypted
  try {
    const iv  = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      enc.encode(plaintext)
    );
    // Pack iv + ciphertext as base64
    const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuf), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.warn("E2EE encrypt error:", err);
    return plaintext;
  }
}

export async function decryptMessage(ciphertext, sharedKey) {
  if (!sharedKey) return ciphertext;
  try {
    const bytes    = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv       = bytes.slice(0, 12);
    const data     = bytes.slice(12);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      data
    );
    return new TextDecoder().decode(plainBuf);
  } catch (err) {
    // Not encrypted or wrong key — return as-is
    return ciphertext;
  }
}

// ── Utility ────────────────────────────────────────────────────

export function isLikelyCiphertext(str) {
  if (!str || str.length < 24) return false;
  try { atob(str); return true; } catch { return false; }
}
