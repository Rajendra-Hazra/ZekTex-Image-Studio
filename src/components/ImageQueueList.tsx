"use client";

import React from "react";
import {
  Download,
  Trash2,
  Play,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Archive,
  X,
  ArrowRight,
} from "lucide-react";
import { ImageItem } from "@/types/image";
import { calculateSavings, formatBytes } from "@/lib/format";

interface ImageQueueListProps {
  items: ImageItem[];
  isProcessingBatch: boolean;
  zipProgress: number | null;
  actionLabel: string;
  onProcessOne: (id: string) => void;
  onProcessAll: () => void;
  onCompare: (item: ImageItem) => void;
  onDownloadOne: (item: ImageItem) => void;
  onDownloadZip: () => void;
  onRemoveOne: (id: string) => void;
  onClearAll: () => void;
}

export function ImageQueueList({
  items,
  isProcessingBatch,
  zipProgress,
  actionLabel,
  onProcessOne,
  onProcessAll,
  onCompare,
  onDownloadOne,
  onDownloadZip,
  onRemoveOne,
  onClearAll,
}: ImageQueueListProps) {
  if (items.length === 0) return null;

  const completedItems = items.filter(
    (item) => item.status === "done" && item.result
  );
  const totalOriginalAll = items.reduce(
    (acc, item) => acc + item.originalSize,
    0
  );
  const totalOriginalDone = completedItems.reduce(
    (acc, item) => acc + item.originalSize,
    0
  );
  const totalOptimizedDone = completedItems.reduce(
    (acc, item) => acc + (item.result?.size ?? 0),
    0
  );
  const batchSavings = calculateSavings(totalOriginalDone, totalOptimizedDone);

  return (
    <section aria-label="Image batch queue" className="saas-card overflow-hidden">
      {/* Top Batch Summary & Action Bar */}
      <div className="flex flex-col gap-4 border-b border-[#EFEFF3] bg-[#FAFAFB] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Responsive KPI Strip */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
              Queue
            </span>
            <p className="tabular-nums mt-0.5 text-sm font-semibold text-[#09090B]">
              {items.length} {items.length === 1 ? "file" : "files"}{" "}
              <span className="font-normal text-[#71717A]">
                ({formatBytes(totalOriginalAll)})
              </span>
            </p>
          </div>

          {completedItems.length > 0 && (
            <>
              <div
                className="hidden h-8 w-px bg-[#E7E7EC] sm:block"
                aria-hidden="true"
              />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Output ({completedItems.length}/{items.length})
                </span>
                <p className="tabular-nums mt-0.5 text-sm font-semibold text-[#09090B]">
                  {formatBytes(totalOptimizedDone)}
                </p>
              </div>

              <div
                className="hidden h-8 w-px bg-[#E7E7EC] sm:block"
                aria-hidden="true"
              />
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Space Saved
                </span>
                <p
                  className={`tabular-nums mt-0.5 text-sm font-semibold ${
                    batchSavings.isSmaller
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {batchSavings.isSmaller
                    ? `${formatBytes(batchSavings.delta)} (-${batchSavings.percent.toFixed(1)}%)`
                    : `+${formatBytes(Math.abs(batchSavings.delta))} (+${Math.abs(batchSavings.percent).toFixed(1)}%)`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Responsive Batch Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onProcessAll}
            disabled={isProcessingBatch || items.length === 0}
            className="col-span-2 inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl bg-[#111113] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#27272A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
          >
            {isProcessingBatch ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>
              {isProcessingBatch
                ? "Processing..."
                : `${actionLabel} All (${items.length})`}
            </span>
          </button>

          {completedItems.length > 0 && (
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={zipProgress !== null}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#4F46E5]/30 bg-[#EEF2FF] px-3.5 py-2 text-xs font-medium text-[#4F46E5] transition-colors hover:bg-[#E0E7FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {zipProgress !== null ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              <span className="tabular-nums">
                {zipProgress !== null
                  ? `Zipping ${zipProgress}%`
                  : `ZIP (${completedItems.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessingBatch}
            className={`${
              completedItems.length === 0 ? "col-span-2 sm:col-span-1" : ""
            } inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E7E7EC] bg-white px-3 py-2 text-xs font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F6] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* ZIP progress bar */}
      {zipProgress !== null && (
        <div className="border-b border-[#EFEFF3] bg-white px-4 py-2 sm:px-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4F4F6]">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all duration-150"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Asset Rows */}
      <ul className="divide-y divide-[#F1F1F5]">
        {items.map((item) => {
          const result = item.result;
          const savings = result
            ? calculateSavings(item.originalSize, result.size)
            : null;

          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAFAFB]/80 sm:px-5 md:flex-row md:items-center md:justify-between"
            >
              {/* Left: Thumbnail + Metadata */}
              <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
                <div className="transparency-grid relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#E7E7EC]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result ? result.url : item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p
                      className="max-w-full truncate text-sm font-medium text-[#09090B]"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <span className="rounded-md bg-[#F4F4F6] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#52525B]">
                      {item.originalFormat}
                    </span>
                    {item.hasTransparency && (
                      <span className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#4F46E5]">
                        ALPHA
                      </span>
                    )}
                  </div>

                  <div className="tabular-nums mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#71717A]">
                    <span>
                      {item.width} × {item.height}px
                    </span>
                    <span>&middot;</span>
                    <span>{formatBytes(item.originalSize)}</span>

                    {result && savings && (
                      <>
                        <ArrowRight className="h-3 w-3 shrink-0 text-[#A1A1AA]" />
                        <span className="font-medium text-[#09090B]">
                          {result.format.toUpperCase()} {result.width}×
                          {result.height}
                        </span>
                        <span className="font-medium text-[#09090B]">
                          {formatBytes(result.size)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            savings.isSmaller
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15"
                          }`}
                        >
                          {savings.isSmaller
                            ? `-${savings.percent.toFixed(1)}%`
                            : `+${Math.abs(savings.percent).toFixed(1)}%`}
                        </span>
                      </>
                    )}
                  </div>

                  {item.status === "error" && item.error && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.error}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Status & Touch-Friendly Action Row */}
              <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#F4F4F6] pt-2.5 md:w-auto md:justify-end md:border-t-0 md:pt-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {item.status === "queued" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F6] px-2.5 py-1 text-xs font-medium text-[#52525B]">
                      <Clock className="h-3 w-3" />
                      Queued
                    </span>
                  )}

                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#4F46E5]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Encoding
                    </span>
                  )}

                  {item.status === "done" && result && (
                    <span className="hidden items-center gap-1 text-xs font-medium text-emerald-600 lg:inline-flex">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onProcessOne(item.id)}
                    disabled={item.status === "processing" || isProcessingBatch}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#E7E7EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18181B] transition-colors hover:border-[#D4D4DC] hover:bg-[#F4F4F6] disabled:opacity-40"
                  >
                    <Play className="h-3 w-3" />
                    <span>{result ? "Re-run" : actionLabel}</span>
                  </button>

                  {result && (
                    <>
                      <button
                        type="button"
                        onClick={() => onCompare(item)}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#E7E7EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18181B] transition-colors hover:border-[#4F46E5]/40 hover:text-[#4F46E5]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Compare</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDownloadOne(item)}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#111113] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#27272A]"
                        title={`Download ${result.outputFilename}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveOne(item.id)}
                  disabled={item.status === "processing"}
                  aria-label={`Remove ${item.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#F4F4F6] hover:text-[#09090B] disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
