"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import {
  QrCode,
  Key,
  RefreshCw,
  Copy,
  Check,
  Camera,
  X,
  ShieldCheck,
  Smartphone,
  Unlink,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  generate12WordPhrase,
  isValid12WordPhrase,
  getStoredSyncPhrase,
  setStoredSyncPhrase,
  clearStoredSyncPhrase,
} from "@/lib/sync/crypto"
import { pullEncryptedSync, pushEncryptedSync } from "@/lib/sync/syncManager"

interface SyncModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSyncComplete?: () => void
}

type SyncTab = "link" | "restore" | "camera"

export function SyncModal({ open, onOpenChange, onSyncComplete }: SyncModalProps) {
  const [tab, setTab] = useState<SyncTab>("link")
  const [phrase, setPhrase] = useState<string>("")
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [inputPhrase, setInputPhrase] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [isError, setIsError] = useState(false)
  const [cameraError, setCameraError] = useState<string>("")
  const html5QrCodeRef = useRef<any>(null)

  // Initialize or load sync phrase
  useEffect(() => {
    if (!open) return

    let current = getStoredSyncPhrase()
    if (!current) {
      current = generate12WordPhrase()
      setStoredSyncPhrase(current)
    }
    setPhrase(current)

    // Generate QR Code containing sync link
    if (typeof window !== "undefined") {
      const origin = window.location.origin
      const syncUrl = `${origin}/?sync=${encodeURIComponent(current)}`

      QRCode.toDataURL(syncUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: "#44403c", // stone-700
          light: "#ffffff",
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error("QR generation error:", err))
    }
  }, [open])

  // Stop camera when modal closes or switching tabs
  useEffect(() => {
    return () => {
      stopCameraScanner()
    }
  }, [])

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch {}
      html5QrCodeRef.current = null
    }
  }

  const startCameraScanner = async () => {
    setTab("camera")
    setCameraError("")

    // Dynamically import html5-qrcode
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scannerId = "moodie-qr-reader"

      // Wait a tick for the container element to mount
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode(scannerId)
          html5QrCodeRef.current = scanner

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            async (decodedText: string) => {
              // Successfully scanned!
              await stopCameraScanner()
              handleScannedContent(decodedText)
            },
            () => {} // frame error handler (ignored)
          )
        } catch (err: unknown) {
          console.error("Camera init error:", err)
          setCameraError("Camera access was denied or is not supported by your browser.")
        }
      }, 100)
    } catch {
      setCameraError("Could not load camera scanner library.")
    }
  }

  const handleScannedContent = async (text: string) => {
    let extracted = text.trim()
    try {
      if (text.includes("sync=")) {
        const url = new URL(text)
        const q = url.searchParams.get("sync")
        if (q) extracted = decodeURIComponent(q)
      }
    } catch {}

    if (isValid12WordPhrase(extracted)) {
      await connectWithPhrase(extracted)
    } else {
      setIsError(true)
      setStatusMessage("Scanned QR code did not contain a valid 12-word sync phrase.")
      setTab("restore")
    }
  }

  const handleCopyPhrase = () => {
    if (!phrase) return
    navigator.clipboard.writeText(phrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCopyLink = () => {
    if (!phrase || typeof window === "undefined") return
    const syncUrl = `${window.location.origin}/?sync=${encodeURIComponent(phrase)}`
    navigator.clipboard.writeText(syncUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setStatusMessage("")
    setIsError(false)
    try {
      // First push current local changes
      await pushEncryptedSync()
      // Then pull any remote changes
      const result = await pullEncryptedSync()
      if (result.success) {
        setStatusMessage(
          result.changesApplied && result.changesApplied > 0
            ? `Synced! Applied ${result.changesApplied} update(s) from other device.`
            : "Everything is in sync ✨"
        )
        onSyncComplete?.()
      } else {
        setIsError(true)
        setStatusMessage(result.error || "Sync failed.")
      }
    } catch {
      setIsError(true)
      setStatusMessage("Could not connect to sync relay.")
    } finally {
      setSyncing(false)
    }
  }

  const connectWithPhrase = async (targetPhrase: string) => {
    const clean = targetPhrase.trim().toLowerCase().replace(/\s+/g, " ")
    if (!isValid12WordPhrase(clean)) {
      setIsError(true)
      setStatusMessage("Invalid 12-word phrase. Please double-check all words.")
      return
    }

    setSyncing(true)
    setStatusMessage("")
    setIsError(false)

    try {
      setStoredSyncPhrase(clean)
      setPhrase(clean)

      // Pull remote encrypted data
      const result = await pullEncryptedSync()
      if (result.success) {
        setStatusMessage("Connected! Journal synced across devices ✨")
        setTab("link")
        onSyncComplete?.()
      } else {
        setIsError(true)
        setStatusMessage(result.error || "Connected, but could not retrieve remote data.")
      }
    } catch {
      setIsError(true)
      setStatusMessage("Error pairing device.")
    } finally {
      setSyncing(false)
    }
  }

  const handleUnlink = () => {
    if (confirm("Unlink sync from this device? Your local entries will NOT be deleted, but this device will no longer sync until re-paired.")) {
      clearStoredSyncPhrase()
      const newPhrase = generate12WordPhrase()
      setStoredSyncPhrase(newPhrase)
      setPhrase(newPhrase)
      setStatusMessage("Device unlinked. A fresh local key has been created.")
      setTimeout(() => setStatusMessage(""), 3500)
    }
  }

  const words = phrase ? phrase.split(" ") : []

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) stopCameraScanner()
        onOpenChange(v)
      }}
    >
      <DialogContent className="bg-white rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-xl border border-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 text-xl shadow-xs">
            ✨
          </div>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-stone-800">
            Cross-Device Sync
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            Zero-knowledge End-to-End Encryption. Only your devices hold the key — the server never sees your entries.
          </DialogDescription>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100/80 p-1 rounded-2xl text-xs font-medium text-stone-600 mt-2">
          <button
            type="button"
            onClick={() => {
              stopCameraScanner()
              setTab("link")
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              tab === "link" ? "bg-white text-stone-900 shadow-2xs font-semibold" : "hover:text-stone-900"
            }`}
          >
            Link Phone / QR
          </button>
          <button
            type="button"
            onClick={() => {
              stopCameraScanner()
              setTab("restore")
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              tab === "restore" || tab === "camera"
                ? "bg-white text-stone-900 shadow-2xs font-semibold"
                : "hover:text-stone-900"
            }`}
          >
            Pair Existing Device
          </button>
        </div>

        {statusMessage && (
          <div
            className={`text-xs text-center py-2 px-3 rounded-2xl border leading-relaxed animate-in fade-in ${
              isError
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* VIEW 1: Show QR & 12 Words to Link another device */}
        {tab === "link" && (
          <div className="space-y-4 pt-1">
            <div className="bg-stone-50/70 p-4 rounded-3xl border border-stone-100 flex flex-col items-center text-center">
              <p className="text-xs font-semibold text-stone-700 mb-2.5 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-600" />
                Scan with Phone Camera
              </p>
              {qrDataUrl ? (
                <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-stone-200/80">
                  <img
                    src={qrDataUrl}
                    alt="Moodie Sync QR Code"
                    className="w-44 h-44 rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-stone-100 rounded-2xl text-stone-400 text-xs">
                  Generating QR...
                </div>
              )}
              <p className="text-[11px] text-stone-400 mt-2.5 leading-relaxed max-w-[220px]">
                Open Moodie on your phone and tap <b>Pair Existing Device</b> or scan directly with your camera.
              </p>
            </div>

            {/* 12-Word Recovery Phrase */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  12-Word Recovery Key
                </p>
                <button
                  type="button"
                  onClick={handleCopyPhrase}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Words"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                {words.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-stone-200/60 shadow-2xs text-xs"
                  >
                    <span className="text-[10px] text-stone-400 font-mono w-3.5 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-stone-700 truncate">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncNow}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Link Copied" : "Copy Direct Pairing Link"}
              </button>
            </div>

            <div className="pt-2 text-center border-t border-stone-100">
              <button
                type="button"
                onClick={handleUnlink}
                className="text-[11px] text-stone-400 hover:text-red-500 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Unlink className="w-3 h-3" />
                Unlink this device
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Pair with existing phrase or open camera */}
        {tab === "restore" && (
          <div className="space-y-4 pt-1">
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-100 text-center space-y-3">
              <div className="text-2xl">📷</div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Scan QR from other device</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Point this device&apos;s camera at the QR code on your laptop or phone.
                </p>
              </div>
              <button
                type="button"
                onClick={startCameraScanner}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Open Camera Scanner
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-stone-400 uppercase tracking-wider">
                Or enter 12 words
              </span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-600">
                12-Word Recovery Phrase
              </label>
              <textarea
                value={inputPhrase}
                onChange={(e) => setInputPhrase(e.target.value)}
                placeholder="apple river sunny forest quiet ocean velvet silver pebble maple coffee summer"
                className="w-full rounded-2xl border border-stone-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none font-mono bg-stone-50/50"
                rows={3}
              />
              <button
                type="button"
                disabled={syncing || !inputPhrase.trim()}
                onClick={() => connectWithPhrase(inputPhrase)}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                {syncing ? "Connecting & Syncing..." : "Connect Journal"}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Active Camera Scanner */}
        {tab === "camera" && (
          <div className="space-y-3 pt-1 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                Scanning QR Code...
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCameraScanner()
                  setTab("restore")
                }}
                className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs space-y-2">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setTab("restore")}
                  className="px-3 py-1 bg-white border border-red-200 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Enter 12 words manually instead
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-black">
                <div id="moodie-qr-reader" className="w-full aspect-square" />
              </div>
            )}
            <p className="text-[11px] text-stone-400">
              Center the QR code in the frame to pair automatically.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
