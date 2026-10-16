import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"

export const SYNC_STORAGE_KEY = "moodie-sync-phrase"

/**
 * Generates a standard 12-word BIP-39 recovery phrase (128 bits of true entropy).
 */
export function generate12WordPhrase(): string {
  return generateMnemonic(wordlist, 128)
}

/**
 * Validates whether a 12-word phrase matches BIP-39 dictionary words and checksum.
 */
export function isValid12WordPhrase(phrase: string): boolean {
  try {
    const clean = phrase.trim().toLowerCase().replace(/\s+/g, " ")
    const words = clean.split(" ")
    if (words.length !== 12) return false
    return validateMnemonic(clean, wordlist)
  } catch {
    return false
  }
}

/**
 * Deterministically derives an AES-GCM-256 CryptoKey from the 12-word phrase.
 */
export async function deriveKeyFromPhrase(phrase: string): Promise<CryptoKey> {
  const clean = phrase.trim().toLowerCase().replace(/\s+/g, " ")
  const seed = mnemonicToSeedSync(clean)

  // Use the first 32 bytes (256 bits) as the raw AES key
  return await crypto.subtle.importKey(
    "raw",
    seed.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Deterministically derives a 64-char hex Channel ID (SHA-256) for the blind sync relay.
 * The server only sees this hash; it cannot reverse it to determine the phrase or keys.
 */
export async function deriveChannelId(phrase: string): Promise<string> {
  const clean = phrase.trim().toLowerCase().replace(/\s+/g, " ")
  const encoder = new TextEncoder()
  const data = encoder.encode("moodie-sync-channel:" + clean)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Encrypts arbitrary data with AES-GCM-256 and packages [12-byte IV + ciphertext] as Base64.
 */
export async function encryptPayload(data: unknown, key: CryptoKey): Promise<string> {
  const jsonStr = JSON.stringify(data)
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(jsonStr)

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  )

  const ciphertext = new Uint8Array(ciphertextBuffer)
  const combined = new Uint8Array(iv.length + ciphertext.length)
  combined.set(iv, 0)
  combined.set(ciphertext, iv.length)

  return uint8ArrayToBase64(combined)
}

/**
 * Decrypts an AES-GCM-256 payload and parses the inner JSON data.
 */
export async function decryptPayload<T = unknown>(encryptedBase64: string, key: CryptoKey): Promise<T> {
  const combined = base64ToUint8Array(encryptedBase64)
  if (combined.length < 13) {
    throw new Error("Invalid encrypted payload structure")
  }

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  const jsonStr = decoder.decode(decryptedBuffer)
  return JSON.parse(jsonStr) as T
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function getStoredSyncPhrase(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(SYNC_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredSyncPhrase(phrase: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, phrase.trim().toLowerCase().replace(/\s+/g, " "))
  } catch {}
}

export function clearStoredSyncPhrase(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(SYNC_STORAGE_KEY)
  } catch {}
}
