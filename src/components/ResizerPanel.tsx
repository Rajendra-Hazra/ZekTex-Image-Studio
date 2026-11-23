"use client";

import React from "react";
import { FitMode, ImageItem, OutputFormat, ResizeMode } from "@/types/image";
import { QUICK_RESIZE_PRESETS } from "@/lib/presets";
import { calculateTargetGeometry } from "@/lib/format";

export interface ResizerConfig {
  mode: Exclude<ResizeMode, "original">;
  width: string;
  height: string;
  percentage: number;
  maxWidth: string;
  maxHeight: string;
  maintainAspectRatio: boolean;
  fitMode: FitMode;
  format: OutputFormat | "original";
  quality: number;
}

interface ResizerPanelProps {
  config: ResizerConfig;
  onChange: (next: ResizerConfig) => void;
  sampleItem?: ImageItem;
}

export function ResizerPanel({
  config,
  onChange,
  sampleItem,
}: ResizerPanelProps) {
  const isPresetSelected = (w: number, h: number) =>
    config.mode === "dimensions" &&
    Number(config.width) === w &&
    Number(config.height) === h;

  const expectedGeometry = sampleItem
    ? calculateTargetGeometry(sampleItem.width, sampleItem.height, {
        resizeMode: config.mode,
        width: config.width ? Number(config.width) : undefined,
        height: config.height ? Number(config.height) : undefined,
        percentage: config.percentage,
        maxWidth: config.maxWidth ? Number(config.maxWidth) : undefined,
        maxHeight: config.maxHeight ? Number(config.maxHeight) : undefined,
        maintainAspectRatio: config.maintainAspectRatio,
        fitMode: config.fitMode,
      })
    : null;

  return (
    <div className="saas-card p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#EFEFF3] pb-3.5 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#09090B]">
            Resize Configuration
          </h2>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Scale assets by exact dimensions, percentage, or max bounds without
            distortion.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid w-full grid-cols-3 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1 text-xs sm:inline-flex sm:w-auto">
          {(
            [
              { id: "dimensions", label: "Dimensions" },
              { id: "percentage", label: "Percentage" },
              { id: "max", label: "Max Bounds" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...config, mode: m.id })}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                config.mode === m.id
                  ? "bg-white text-[#09090B] shadow-xs ring-1 ring-black/[0.04]"
                  : "text-[#52525B] hover:text-[#09090B]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Dimension Presets */}
      <div className="mb-6">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
          Quick Dimension Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_RESIZE_PRESETS.map((preset) => {
            const active = isPresetSelected(preset.width, preset.height);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    mode: "dimensions",
                    width: String(preset.width),
                    height: String(preset.height),
                  })
                }
                className={`tabular-nums rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border-[#111113] bg-[#111113] text-white shadow-xs"
                    : "border-[#E7E7EC] bg-white text-[#3F3F46] hover:border-[#D4D4DC] hover:bg-[#FAFAFB]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onChange({ ...config, mode: "dimensions" })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              config.mode === "dimensions" &&
              !QUICK_RESIZE_PRESETS.some((p) =>
                isPresetSelected(p.width, p.height)
              )
                ? "border-[#4F46E5]/40 bg-[#EEF2FF] text-[#4F46E5]"
                : "border-[#E7E7EC] bg-white text-[#71717A] hover:text-[#09090B]"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Primary Resize Controls */}
        <div className="space-y-3.5">
          {config.mode === "dimensions" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="resize-width"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Width (px)
                  </label>
                  <input
                    id="resize-width"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="800"
                    value={config.width}
                    onChange={(e) =>
                      onChange({ ...config, width: e.target.value })
                    }
                    className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="resize-height"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Height (px)
                  </label>
                  <input
                    id="resize-height"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="400"
                    value={config.height}
                    onChange={(e) =>
                      onChange({ ...config, height: e.target.value })
                    }
                    className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#18181B]">
                <input
                  type="checkbox"
                  checked={config.maintainAspectRatio}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      maintainAspectRatio: e.target.checked,
                      fitMode: e.target.checked
                        ? config.fitMode === "stretch"
                          ? "contain"
                          : config.fitMode
                        : "stretch",
                    })
                  }
                  className="h-4 w-4 rounded border-[#D4D4DC]"
                />
                <span>Maintain aspect ratio (prevent stretching)</span>
              </label>

              {config.maintainAspectRatio && (
                <div>
                  <span className="mb-1.5 block text-[11px] font-medium text-[#71717A]">
                    Fit Behavior
                  </span>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1">
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, fitMode: "contain" })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        config.fitMode === "contain"
                          ? "bg-white text-[#09090B] shadow-xs"
                          : "text-[#52525B]"
                      }`}
                    >
                      Contain (No Crop)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, fitMode: "cover" })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        config.fitMode === "cover"
                          ? "bg-white text-[#09090B] shadow-xs"
                          : "text-[#52525B]"
                      }`}
                    >
                      Cover (Exact Crop)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {config.mode === "percentage" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="resize-pct"
                  className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
                >
                  Scale Factor
                </label>
                <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
                  {config.percentage}%
                </span>
              </div>
              <input
                id="resize-pct"
                type="range"
                min={10}
                max={200}
                step={5}
                value={config.percentage}
                onChange={(e) =>
                  onChange({ ...config, percentage: Number(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
              <div className="mt-2.5 flex gap-1.5">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChange({ ...config, percentage: pct })}
                    className={`tabular-nums rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      config.percentage === pct
                        ? "border-[#111113] bg-[#111113] text-white"
                        : "border-[#E7E7EC] bg-white text-[#3F3F46]"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.mode === "max" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="max-width"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Max Width (px)
                  </label>
                  <input
                    id="max-width"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="1200"
                    value={config.maxWidth}
                    onChange={(e) =>
                      onChange({ ...config, maxWidth: e.target.value })
                    }
                    className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="max-height"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Max Height (px)
                  </label>
                  <input
                    id="max-height"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="1200"
                    value={config.maxHeight}
                    onChange={(e) =>
                      onChange({ ...config, maxHeight: e.target.value })
                    }
                    className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                  />
                </div>
              </div>
              <p className="text-xs text-[#71717A]">
                Smaller images keep their native dimensions (no upscaling).
              </p>
            </div>
          )}
        </div>

        {/* Output Format & Quality */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="resizer-format"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
            >
              Output Format
            </label>
            <select
              id="resizer-format"
              value={config.format}
              onChange={(e) =>
                onChange({
                  ...config,
                  format: e.target.value as OutputFormat | "original",
                })
              }
              className="w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
            >
              <option value="original">Keep Original Format</option>
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="resizer-quality"
                className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
              >
                Quality
              </label>
              <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
                {config.quality}%
              </span>
            </div>
            <input
              id="resizer-quality"
              type="range"
              min={10}
              max={100}
              value={config.quality}
              onChange={(e) =>
                onChange({ ...config, quality: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Expected Output Dimension Preview */}
        <div className="flex flex-col justify-between rounded-xl border border-[#E7E7EC] bg-[#FAFAFB] p-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
              Calculated Dimensions
            </span>
            {sampleItem && expectedGeometry ? (
              <div className="mt-3 space-y-2 text-xs">
                <p className="truncate font-medium text-[#52525B]">
                  {sampleItem.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">Original</span>
                  <span className="tabular-nums font-medium text-[#09090B]">
                    {sampleItem.width} × {sampleItem.height}px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">Target Output</span>
                  <span className="tabular-nums font-semibold text-[#4F46E5]">
                    {expectedGeometry.targetWidth} ×{" "}
                    {expectedGeometry.targetHeight}px
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-[#71717A]">
                Upload an asset to preview exact calculated output dimensions.
              </p>
            )}
          </div>
          {!config.maintainAspectRatio && config.mode === "dimensions" && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
              Aspect ratio unlocked — output may stretch if proportions differ.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
