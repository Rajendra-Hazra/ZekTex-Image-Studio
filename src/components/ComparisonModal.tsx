"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { ImageItem } from "@/types/image";
import { calculateSavings, formatBytes } from "@/lib/format";

interface ComparisonModalProps {
  item: ImageItem | null;
  onClose: () => void;
  onDownload: (item: ImageItem) => void;
}

type CompareView = "toggle" | "side-by-side" | "split";

export function ComparisonModal({
  item,
  onClose,
  onDownload,
}: ComparisonModalProps) {
  const [view, setView] = useState<CompareView>("side-by-side");
  const [activeLayer, setActiveLayer] = useState<"original" | "optimized">(
    "optimized"
  );
  const [splitPos, setSplitPos] = useState(50);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item || !item.result) return null;

  const result = item.result;
  const savings = calculateSavings(item.originalSize, result.size);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Before and after comparison for ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/60 p-2 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E7E7EC] bg-white shadow-2xl sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[#EFEFF3] bg-[#FAFAFB] px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:min-w-0">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight text-[#09090B] sm:text-[15px]">
                Visual Inspector &middot; {item.name}
              </h2>
              <p className="tabular-nums mt-0.5 text-xs text-[#71717A]">
                {result.engineUsed} &middot; {result.durationMs} ms
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E7E7EC] bg-white text-[#71717A] transition-colors hover:bg-[#F4F4F6] hover:text-[#09090B] sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="grid w-full grid-cols-3 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1 text-xs sm:inline-flex sm:w-auto">
              {(
                [
                  { id: "side-by-side", label: "Side by Side" },
                  { id: "split", label: "Split Slider" },
                  { id: "toggle", label: "Toggle" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`rounded-lg px-2 py-1.5 font-medium transition-all sm:px-2.5 sm:py-1 ${
                    view === tab.id
                      ? "bg-white text-[#09090B] shadow-xs ring-1 ring-black/[0.04]"
                      : "text-[#52525B] hover:text-[#09090B]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison"
              className="hidden h-8 w-8 items-center justify-center rounded-xl border border-[#E7E7EC] bg-white text-[#71717A] transition-colors hover:bg-[#F4F4F6] hover:text-[#09090B] sm:inline-flex"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 border-b border-[#EFEFF3] bg-white px-4 py-3 text-xs sm:grid-cols-4 sm:px-5 sm:py-3.5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
              Original
            </span>
            <p className="tabular-nums mt-0.5 font-semibold text-[#09090B]">
              {formatBytes(item.originalSize)} &middot; {item.width}×
              {item.height}px
            </p>
            <span className="text-[11px] text-[#71717A]">
              {item.originalFormat}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
              Optimized
            </span>
            <p className="tabular-nums mt-0.5 font-semibold text-[#09090B]">
              {formatBytes(result.size)} &middot; {result.width}×{result.height}
              px
            </p>
            <span className="text-[11px] font-medium uppercase text-[#4F46E5]">
              {result.format}{" "}
              {result.lossless ? "(Lossless)" : `@ ${result.quality}%`}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
              Delta
            </span>
            <p
              className={`tabular-nums mt-0.5 font-semibold ${
                savings.isSmaller ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {savings.isSmaller
                ? `-${savings.percent.toFixed(1)}% (${formatBytes(savings.delta)})`
                : `+${Math.abs(savings.percent).toFixed(1)}% (+${formatBytes(Math.abs(savings.delta))})`}
            </p>
            <span className="text-[11px] text-[#71717A]">
              Measured output size
            </span>
          </div>

          <div className="col-span-2 flex items-center sm:col-span-1 sm:justify-end">
            <button
              type="button"
              onClick={() => onDownload(item)}
              className="inline-flex min-h-[36px] w-full items-center justify-center gap-2 rounded-xl bg-[#111113] px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#27272A] sm:w-auto"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {result.format.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Visual Viewport */}
        <div className="flex-1 overflow-auto bg-[#FAFAFB] p-3.5 sm:p-5">
          {view === "side-by-side" && (
            <div className="grid gap-3.5 md:grid-cols-2 md:gap-4">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E7E7EC] bg-white">
                <div className="flex items-center justify-between border-b border-[#EFEFF3] px-3.5 py-2 text-xs font-medium text-[#52525B] sm:px-4 sm:py-2.5">
                  <span>Original ({item.originalFormat})</span>
                  <span className="tabular-nums">
                    {formatBytes(item.originalSize)}
                  </span>
                </div>
                <div className="transparency-grid flex h-56 items-center justify-center p-3 sm:h-80 sm:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={`Original ${item.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#4F46E5]/30 bg-white ring-1 ring-[#4F46E5]/10">
                <div className="flex items-center justify-between border-b border-[#EFEFF3] bg-[#EEF2FF]/50 px-3.5 py-2 text-xs font-medium text-[#4F46E5] sm:px-4 sm:py-2.5">
                  <span>Optimized ({result.format.toUpperCase()})</span>
                  <span className="tabular-nums">
                    {formatBytes(result.size)}
                  </span>
                </div>
                <div className="transparency-grid flex h-56 items-center justify-center p-3 sm:h-80 sm:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.url}
                    alt={`Optimized ${result.outputFilename}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {view === "toggle" && (
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex justify-center sm:mb-4">
                <div className="grid w-full grid-cols-2 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1 text-xs sm:inline-flex sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveLayer("original")}
                    className={`tabular-nums rounded-lg px-3 py-1.5 font-medium transition-all sm:px-4 ${
                      activeLayer === "original"
                        ? "bg-white text-[#09090B] shadow-xs"
                        : "text-[#52525B]"
                    }`}
                  >
                    Original ({formatBytes(item.originalSize)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLayer("optimized")}
                    className={`tabular-nums rounded-lg px-3 py-1.5 font-medium transition-all sm:px-4 ${
                      activeLayer === "optimized"
                        ? "bg-[#111113] text-white shadow-xs"
                        : "text-[#52525B]"
                    }`}
                  >
                    Optimized ({formatBytes(result.size)})
                  </button>
                </div>
              </div>

              <div className="transparency-grid flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-[#E7E7EC] p-3 sm:h-96 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeLayer === "original" ? item.previewUrl : result.url}
                  alt={`${activeLayer} preview`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}

          {view === "split" && (
            <div className="mx-auto max-w-3xl space-y-3.5">
              <div className="transparency-grid relative h-64 w-full overflow-hidden rounded-2xl border border-[#E7E7EC] sm:h-96">
                {/* Optimized Base Layer */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt="Optimized layer"
                  className="absolute inset-0 h-full w-full object-contain p-4"
                />

                {/* Original Clipped Layer */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt="Original layer"
                    className="h-full w-full object-contain p-4"
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#4F46E5]"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#4F46E5] text-[10px] font-bold text-white shadow-md">
                    &harr;
                  </div>
                </div>

                <span className="pointer-events-none absolute top-3 left-3 rounded-lg bg-[#09090B]/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                  Original
                </span>
                <span className="pointer-events-none absolute top-3 right-3 rounded-lg bg-[#4F46E5] px-2.5 py-1 text-[11px] font-medium text-white">
                  Optimized
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#52525B]">
                  Original
                </span>
                <input
                  type="range"
                  aria-label="Split comparison slider"
                  min={0}
                  max={100}
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs font-medium text-[#4F46E5]">
                  Optimized
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
