"use client";

import React from "react";
import { Check, Layers, RotateCcw } from "lucide-react";
import { FitMode, ImageItem, OutputFormat } from "@/types/image";
import { OMIBAY_PRESETS } from "@/lib/presets";
import { calculateTargetGeometry } from "@/lib/format";

export interface OmiBayPresetConfig {
  presetId: string;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
  lossless: boolean;
  fitMode: FitMode;
  preserveTransparency: boolean;
}

interface OmiBayPresetsPanelProps {
  config: OmiBayPresetConfig;
  onChange: (next: OmiBayPresetConfig) => void;
  sampleItem?: ImageItem;
}

export function OmiBayPresetsPanel({
  config,
  onChange,
  sampleItem,
}: OmiBayPresetsPanelProps) {
  const activePreset =
    OMIBAY_PRESETS.find((p) => p.id === config.presetId) ?? OMIBAY_PRESETS[0];

  const selectPreset = (presetId: string) => {
    const preset = OMIBAY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      presetId: preset.id,
      width: preset.width,
      height: preset.height,
      format: preset.format,
      quality: preset.quality,
      lossless: false,
      fitMode: "cover",
      preserveTransparency: true,
    });
  };

  const previewGeometry = sampleItem
    ? calculateTargetGeometry(sampleItem.width, sampleItem.height, {
        resizeMode: "dimensions",
        width: config.width,
        height: config.height,
        maintainAspectRatio: true,
        fitMode: config.fitMode,
      })
    : null;

  return (
    <div className="space-y-4">
      {/* 4 Preset Profile Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {OMIBAY_PRESETS.map((preset) => {
          const isSelected = config.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-[#4F46E5] bg-white ring-2 ring-[#4F46E5]/15 shadow-xs"
                  : "border-[#E7E7EC] bg-white hover:border-[#C7C7D4]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-[#09090B]">
                    {preset.name}
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isSelected
                        ? "bg-[#4F46E5] text-white"
                        : "border border-[#D4D4DC] bg-[#FAFAFB]"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#71717A]">
                  {preset.description}
                </p>
              </div>

              <div className="tabular-nums mt-4 flex flex-wrap gap-1.5 border-t border-[#F1F1F5] pt-3 text-[11px] font-medium">
                <span className="rounded-md bg-[#F4F4F6] px-2 py-0.5 text-[#09090B]">
                  {preset.width} × {preset.height}
                </span>
                <span className="rounded-md bg-[#EEF2FF] px-2 py-0.5 uppercase text-[#4F46E5]">
                  {preset.format}
                </span>
                <span className="rounded-md bg-[#F4F4F6] px-2 py-0.5 text-[#52525B]">
                  Q{preset.quality}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Preset Override & Expected Output Preview */}
      <div className="saas-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF3] pb-3.5 sm:mb-5 sm:pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-[#09090B]">
                {activePreset.name} Profile
              </h2>
              <p className="text-xs text-[#71717A]">
                Automatically applied — override any parameter manually if needed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => selectPreset(activePreset.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E7EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#52525B] hover:bg-[#F4F4F6] hover:text-[#09090B]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Preset</span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Dimensions & Fit */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="preset-width"
                  className="mb-1 block text-[11px] font-medium text-[#52525B]"
                >
                  Width (px)
                </label>
                <input
                  id="preset-width"
                  type="number"
                  min={16}
                  max={8192}
                  value={config.width}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      width: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                />
              </div>
              <div>
                <label
                  htmlFor="preset-height"
                  className="mb-1 block text-[11px] font-medium text-[#52525B]"
                >
                  Height (px)
                </label>
                <input
                  id="preset-height"
                  type="number"
                  min={16}
                  max={8192}
                  value={config.height}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      height: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="tabular-nums w-full rounded-xl border border-[#D4D4DC] bg-white px-3 py-2 text-sm text-[#09090B]"
                />
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-medium text-[#71717A]">
                Framing Mode
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1">
                <button
                  type="button"
                  onClick={() => onChange({ ...config, fitMode: "cover" })}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    config.fitMode === "cover"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  Exact Size (Crop)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...config, fitMode: "contain" })}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    config.fitMode === "contain"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  Fit Inside
                </button>
              </div>
            </div>
          </div>

          {/* Format, Quality & Sharp Graphics */}
          <div className="space-y-3.5">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
                Format (Logos &amp; Sharp Graphics)
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...config, format: "webp", lossless: false })
                  }
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                    config.format === "webp" && !config.lossless
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  WebP
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...config, format: "webp", lossless: true })
                  }
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                    config.format === "webp" && config.lossless
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  Lossless
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...config, format: "png", lossless: true })
                  }
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                    config.format === "png"
                      ? "bg-white text-[#09090B] shadow-xs"
                      : "text-[#52525B]"
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="preset-quality"
                  className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
                >
                  Quality
                </label>
                <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
                  {config.lossless ? "Lossless" : `${config.quality}%`}
                </span>
              </div>
              <input
                id="preset-quality"
                type="range"
                min={10}
                max={100}
                disabled={config.lossless}
                value={config.quality}
                onChange={(e) =>
                  onChange({ ...config, quality: Number(e.target.value) })
                }
                className="w-full cursor-pointer disabled:opacity-40"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#3F3F46]">
              <input
                type="checkbox"
                checked={config.preserveTransparency}
                onChange={(e) =>
                  onChange({
                    ...config,
                    preserveTransparency: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-[#D4D4DC]"
              />
              <span>Preserve transparency for icons &amp; logos</span>
            </label>
          </div>

          {/* Expected Output Preview */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E7E7EC] bg-[#FAFAFB] p-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
                Expected Output Preview
              </span>
              <div className="mt-3 flex items-center gap-3.5">
                <div
                  className="transparency-grid flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#D4D4DC]"
                  style={{
                    width: config.width > config.height ? 92 : 64,
                    height: config.width > config.height ? 46 : 64,
                  }}
                >
                  {sampleItem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sampleItem.previewUrl}
                      alt="Expected preset output preview"
                      className={`h-full w-full ${
                        config.fitMode === "cover"
                          ? "object-cover"
                          : "object-contain"
                      }`}
                    />
                  ) : (
                    <span className="tabular-nums text-[10px] font-medium text-[#71717A]">
                      {config.width}×{config.height}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs text-[#52525B]">
                  <p className="tabular-nums">
                    Output:{" "}
                    <strong className="text-[#09090B]">
                      {previewGeometry
                        ? `${previewGeometry.targetWidth} × ${previewGeometry.targetHeight}px`
                        : `${config.width} × ${config.height}px`}
                    </strong>
                  </p>
                  <p className="tabular-nums">
                    Codec:{" "}
                    <strong className="uppercase text-[#4F46E5]">
                      {config.lossless
                        ? `Lossless ${config.format}`
                        : `${config.format} @ ${config.quality}%`}
                    </strong>
                  </p>
                  <p className="text-[11px] text-[#71717A]">
                    {activePreset.recommendedFor}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
