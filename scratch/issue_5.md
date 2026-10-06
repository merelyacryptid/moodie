### 🎯 Problem Statement
Since moodie is a local-first application meant for daily reflection on phones as well as laptops, users need to be able to install it directly to their mobile home screen without app store friction, and have it work seamlessly offline.

### 💡 Proposed Solution
1. **Web App Manifest (`manifest.json` / `manifest.webmanifest`)**:
   - Provide proper metadata: `name: "moodie"`, `short_name: "moodie"`, `display: "standalone"`, `background_color: "#fef9ef"`, `theme_color: "#fbbf24"`.
   - Provide crisp vector/PNG icons (`192x192`, `512x512`, `apple-touch-icon`, and maskable icons).
2. **Service Worker Caching**:
   - Cache Next.js static assets, fonts (Nunito, Fredoka), and core bundles so the shell loads instantly offline.
   - All runtime dynamic data already lives locally in browser IndexedDB via Dexie.
3. **Install Prompt Banner**:
   - Friendly in-app prompt or helper modal explaining how to "Add to Home Screen" on iOS Safari and Android Chrome.

### ✅ Acceptance Criteria
- [ ] Valid `manifest.json` configured in Next.js App Router metadata.
- [ ] iOS `apple-touch-icon` and full viewport safe-area padding support.
- [ ] Service worker caches assets for 100% offline functionality.
- [ ] Passes Lighthouse PWA audit criteria.
