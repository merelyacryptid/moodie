### 🎯 Problem Statement
Users reflect throughout their day across different personal devices (e.g., logging morning mood on their phone and writing evening reflections on their laptop). However, because Moodie is strictly local-first and accountless, it cannot require traditional login accounts, email/password credentials, or cloud storage providers that store plaintext reflections on remote servers.

### 💡 Implemented Architecture

#### 1. 12-Word BIP-39 Cryptographic Engine (`src/lib/sync/crypto.ts`)
- **True Entropy**: Generates 128 bits of cryptographic entropy converted into 12 standardized BIP-39 words with built-in checksum verification.
- **Key Derivation**: Derives an `AES-GCM-256` symmetric encryption key client-side using Web Crypto (`mnemonicToSeedSync` + `crypto.subtle.importKey`).
- **One-Way Channel Hash**: Derives a 64-character SHA-256 hex channel identifier (`SHA-256("moodie-sync-channel:" + phrase)`).
- **Strict Zero-Knowledge**: The server never sees the user's 12-word phrase or encryption key. It is mathematically impossible for the server or database operator to reverse the channel ID or decrypt the stored ciphertext blobs.

#### 2. WhatsApp-Style QR Code & Camera Pairing Engine (`src/components/SyncModal.tsx`)
- **QR Code Generation**: Dynamically generates a high-resolution QR code encoding a secure direct pairing URI (`/?sync=<phrase>`).
- **Camera Scanning**: Integrated real-time camera scanner (`html5-qrcode`) allowing phones to instantly scan laptop screens.
- **Direct Link / Copy**: Supports 1-click copying of the 12-word recovery key or direct pairing link.
- **Persistent Pairing**: Once paired, the secret phrase is stored locally in the browser's storage; neither device ever asks the user to "sign in" again.

#### 3. E2EE Sync Relay & Conflict-Free Merge Engine (`src/lib/sync/syncManager.ts` & `/api/sync/[channelId]`)
- **Relay Endpoint**: `/api/sync/[channelId]` stores and serves opaque encrypted ciphertext blobs with versioning in SQLite (`SyncRoom` model).
- **Intelligent Local Merging**:
  - **Reflections**: Last-Write-Wins based on `loggedAt` timestamps per date/slot.
  - **Habit Completions**: Set union preserving checks from both devices.
  - **Habits**: Union of custom habits by ID and name.
  - **Prompts & Activities**: Union merging preserving custom additions.
- **Automatic Sync**:
  - Automatically pushes encrypted updates upon saving or deleting reflections.
  - Automatically pulls remote changes on app open and date navigation.

### ✅ Acceptance Criteria
- [x] 12-word BIP-39 recovery phrase generation, validation, and deterministic key derivation.
- [x] Client-side AES-GCM-256 encryption and decryption using native Web Crypto API.
- [x] Zero-knowledge blind sync relay API endpoint (`/api/sync/[channelId]`) storing only ciphertext.
- [x] QR code generator and in-browser camera QR scanner for device pairing.
- [x] Intelligent client-side merging for reflections, habits, prompts, and custom activities.
- [x] Quick pairing buttons available on Welcome page and Today page header.
