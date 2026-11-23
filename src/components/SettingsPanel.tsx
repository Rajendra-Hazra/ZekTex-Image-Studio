"use client";

import React from "react";
import { CheckCircle2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import {
  BrowserCapabilities,
  StudioSettings,
  WebpEngine,
} from "@/types/image";
import { DEFAULT_STUDIO_SETTINGS } from "@/lib/presets";

interface SettingsPanelProps {
  settings: StudioSettings;
  onChange: (next: StudioSettings) => void;
  capabilities: BrowserCapabilities | null;
}

export function SettingsPanel({
  settings,
  onChange,
  capabilities,
}: SettingsPanelProps) {
  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
      {/* Main Settings Form */}
      <div className="saas-card p-4 sm:p-6 lg:col-span-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF3] pb-3.5 sm:mb-6 sm:pb-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#09090B]">
              Engine &amp; Export Settings
            </h2>
            <p className="mt-0.5 text-xs text-[#71717A]">
              Fine-tune Web Worker concurrency, WebP encoding backend, and export
              conventions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_STUDIO_SETTINGS })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E7EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#52525B] hover:bg-[#F4F4F6] hover:text-[#09090B]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Batch Concurrency */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="settings-concurrency"
                className="text-sm font-medium text-[#09090B]"
              >
                Batch Concurrency Limit
              </label>
              <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
                {settings.concurrency}{" "}
                {settings.concurrency === 1 ? "worker" : "workers"}
              </span>
            </div>
            <input
              id="settings-concurrency"
              type="range"
              min={1}
              max={4}
              step={1}
              value={settings.concurrency}
              onChange={(e) =>
                onChange({ ...settings, concurrency: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-[#71717A]">
              Limits simultaneous worker threads to prevent memory spikes during
              large batches.
            </p>
          </div>

          {/* WebP Encoder Engine */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#09090B]">
              WebP Encoder Backend
            </label>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(
                [
                  {
                    value: "auto",
                    label: "Auto (Recommended)",
                    desc: "Canvas for lossy, libwebp WASM for lossless & fallback",
                  },
                  {
                    value: "wasm",
                    label: "libwebp WebAssembly",
                    desc: "Squoosh libwebp WASM encoder across all browsers",
                  },
                  {
                    value: "canvas",
                    label: "Browser Canvas API",
                    desc: "Native browser WebP encoding for maximum speed",
                  },
                ] as { value: WebpEngine; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({ ...settings, webpEngine: opt.value })
                  }
                  className={`rounded-xl border p-3.5 text-left transition-all ${
                    settings.webpEngine === opt.value
                      ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]/20"
                      : "border-[#E7E7EC] bg-[#FAFAFB] hover:border-[#D4D4DC]"
                  }`}
                >
                  <p className="text-xs font-semibold text-[#09090B]">
                    {opt.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#71717A]">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Matte Color & Filename Suffix */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="settings-matte"
                className="mb-1.5 block text-sm font-medium text-[#09090B]"
              >
                JPEG Transparency Matte
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="settings-matte"
                  type="color"
                  value={settings.jpegMatteColor}
                  onChange={(e) =>
                    onChange({ ...settings, jpegMatteColor: e.target.value })
                  }
                  className="h-9 w-11 cursor-pointer rounded-lg border border-[#D4D4DC] bg-white p-0.5"
                />
                <input
                  type="text"
                  value={settings.jpegMatteColor}
                  onChange={(e) =>
                    onChange({ ...settings, jpegMatteColor: e.target.value })
                  }
                  className="tabular-nums flex-1 rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-xs font-medium uppercase text-[#09090B]"
                />
              </div>
              <p className="mt-1.5 text-xs text-[#71717A]">
                Fill color used when flattening transparent assets to JPEG.
              </p>
            </div>

            <div>
              <label
                htmlFor="settings-suffix"
                className="mb-1.5 block text-sm font-medium text-[#09090B]"
              >
                Filename Suffix (Optional)
              </label>
              <input
                id="settings-suffix"
                type="text"
                placeholder="e.g. -opt or leave empty"
                value={settings.filenameSuffix}
                onChange={(e) =>
                  onChange({ ...settings, filenameSuffix: e.target.value })
                }
                className="w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
              />
              <p className="mt-1.5 text-xs text-[#71717A]">
                Preview:{" "}
                <code className="rounded bg-[#F4F4F6] px-1.5 py-0.5 text-[11px] text-[#09090B]">
                  banner{settings.filenameSuffix || ""}.webp
                </code>
              </p>
            </div>
          </div>

          {/* Unsaved Leave Warning */}
          <div className="border-t border-[#EFEFF3] pt-4">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[#09090B]">
              <input
                type="checkbox"
                checked={settings.warnOnLeave}
                onChange={(e) =>
                  onChange({ ...settings, warnOnLeave: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-[#D4D4DC]"
              />
              <span>
                <strong className="font-medium">
                  Warn before leaving with un-downloaded images
                </strong>
                <span className="mt-0.5 block text-xs text-[#71717A]">
                  Prevents accidental loss of locally processed files when
                  closing or reloading the browser tab.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Privacy & Browser Diagnostics */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E7E7EC] bg-[#111113] p-5 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#818CF8]" />
            <h3 className="text-sm font-semibold">Zero-Upload Architecture</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#A1A1AA]">
            <li>&bull; 100% client-side execution inside your browser.</li>
            <li>&bull; No external APIs, cloud storage, or analytics.</li>
            <li>&bull; EXIF &amp; camera metadata stripped on re-encode.</li>
            <li>&bull; Object URLs &amp; canvas buffers released automatically.</li>
          </ul>
        </div>

        <div className="saas-card p-5">
          <h3 className="text-sm font-semibold text-[#09090B]">
            Runtime Diagnostics
          </h3>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Detected browser capabilities on this device.
          </p>
          <dl className="mt-4 space-y-2.5 text-xs">
            {[
              { label: "Canvas WebP Encoding", ok: capabilities?.canvasWebP },
              { label: "AVIF Image Decoding", ok: capabilities?.avifDecode },
              { label: "OffscreenCanvas", ok: capabilities?.offscreenCanvas },
              { label: "Web Workers", ok: capabilities?.webWorker },
              { label: "WebAssembly (libwebp)", ok: capabilities?.webAssembly },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-[#F4F4F6] pb-2.5 last:border-b-0 last:pb-0"
              >
                <dt className="text-[#52525B]">{row.label}</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  {row.ok ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#71717A]">
                      <XCircle className="h-3.5 w-3.5" />
                      Fallback
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
