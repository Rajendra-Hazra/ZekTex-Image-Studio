"use client";

import React, { useState } from "react";
import { Download, Eye } from "lucide-react";
import { ImageItem, OutputFormat } from "@/types/image";
import { calculateSavings, formatBytes } from "@/lib/format";

export interface CompressorConfig {
  keepOriginalFormat: boolean;
  targetFormat: OutputFormat;
  quality: number;
}

interface CompressorPanelProps {
  config: CompressorConfig;
  onChange: (next: CompressorConfig) => void;
  items: ImageItem[];
  onDownloadOne: (item: ImageItem) => void;
  onCompare: (item: ImageItem) => void;
}

export function CompressorPanel({
  config,
  onChange,
  items,
  onDownloadOne,
  onCompare,
}: CompressorPanelProps) {
  const [previewMode, setPreviewMode] = useState<"compressed" | "original">(
    "compressed"
  );

  const firstCompressed = items.find(
    (item) => item.status === "done" && item.result
  );
  const savings =
    firstCompressed && firstCompressed.result
      ? calculateSavings(
          firstCompressed.originalSize,
          firstCompressed.result.size
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="saas-card p-4 sm:p-6">
        <div className="mb-4 border-b border-[#EFEFF3] pb-3.5 sm:mb-5 sm:pb-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#09090B]">
            Compression Controls
          </h2>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Optimize PNG, JPEG, and WebP file weight locally. Actual savings are
            calculated from real encoded output.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quality Slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="compressor-quality"
                className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
              >
                Target Quality
              </label>
              <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
                {config.quality}%
              </span>
            </div>
            <input
              id="compressor-quality"
              type="range"
              min={10}
              max={100}
              step={1}
              value={config.quality}
              onChange={(e) =>
                onChange({ ...config, quality: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-[#A1A1AA]">
              <span>10% Aggressive</span>
              <span>75% Balanced</span>
              <span>100% High Fidelity</span>
            </div>
            <p className="mt-3 text-xs text-[#71717A]">
              PNG files compressed below 100% use local palette quantization
              while retaining alpha transparency.
            </p>
          </div>

          {/* Format Handling */}
          <div>
            <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
              Format Strategy
            </label>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#18181B]">
              <input
                type="checkbox"
                checked={config.keepOriginalFormat}
                onChange={(e) =>
                  onChange({ ...config, keepOriginalFormat: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#D4D4DC]"
              />
              <span>Preserve each image&apos;s original format (PNG / JPEG / WebP)</span>
            </label>

            {!config.keepOriginalFormat && (
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1">
                {(["webp", "jpeg", "png"] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onChange({ ...config, targetFormat: fmt })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase transition-all ${
                      config.targetFormat === fmt
                        ? "bg-white text-[#09090B] shadow-xs ring-1 ring-black/[0.04]"
                        : "text-[#52525B] hover:text-[#09090B]"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Original vs Compressed Preview Card */}
      {firstCompressed && firstCompressed.result && savings && (
        <div className="saas-card p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[#09090B]">
                Live Output Preview &middot; {firstCompressed.name}
              </h3>
              <p className="tabular-nums mt-0.5 text-xs text-[#71717A]">
                {firstCompressed.result.engineUsed} &middot;{" "}
                {firstCompressed.result.durationMs} ms
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="grid grid-cols-2 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1 text-xs sm:inline-flex">
                <button
                  type="button"
                  onClick={() => setPreviewMode("original")}
                  className={`tabular-nums rounded-lg px-2.5 py-1.5 font-medium transition-all sm:px-3 sm:py-1 ${
                    previewMode === "original"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  Original ({formatBytes(firstCompressed.originalSize)})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("compressed")}
                  className={`tabular-nums rounded-lg px-2.5 py-1.5 font-medium transition-all sm:px-3 sm:py-1 ${
                    previewMode === "compressed"
                      ? "bg-[#111113] text-white shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  Optimized ({formatBytes(firstCompressed.result.size)})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => onCompare(firstCompressed)}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-[#E7E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#18181B] hover:border-[#4F46E5]/40 hover:text-[#4F46E5]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadOne(firstCompressed)}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#111113] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#27272A]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="transparency-grid flex h-52 items-center justify-center overflow-hidden rounded-xl border border-[#E7E7EC] p-3 sm:h-64 lg:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  previewMode === "original"
                    ? firstCompressed.previewUrl
                    : firstCompressed.result.url
                }
                alt={`${previewMode} preview of ${firstCompressed.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col justify-center gap-4 rounded-xl border border-[#E7E7EC] bg-[#FAFAFB] p-5">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Original Weight
                </span>
                <p className="tabular-nums mt-0.5 text-xl font-semibold text-[#09090B]">
                  {formatBytes(firstCompressed.originalSize)}
                </p>
              </div>
              <div className="h-px bg-[#EFEFF3]" />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Compressed Weight
                </span>
                <p className="tabular-nums mt-0.5 text-xl font-semibold text-[#09090B]">
                  {formatBytes(firstCompressed.result.size)}
                </p>
              </div>
              <div className="h-px bg-[#EFEFF3]" />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Measured Reduction
                </span>
                <p
                  className={`tabular-nums mt-0.5 text-lg font-semibold ${
                    savings.isSmaller ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {savings.isSmaller
                    ? `-${savings.percent.toFixed(1)}% (${formatBytes(savings.delta)})`
                    : `+${Math.abs(savings.percent).toFixed(1)}% larger`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
