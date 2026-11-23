"use client";

import React from "react";
import { FitMode, OutputFormat } from "@/types/image";

export interface ConverterConfig {
  format: OutputFormat;
  quality: number;
  lossless: boolean;
  maintainOriginalDimensions: boolean;
  width: string;
  height: string;
  maintainAspectRatio: boolean;
  fitMode: FitMode;
  preserveTransparency: boolean;
}

interface ConverterPanelProps {
  config: ConverterConfig;
  onChange: (next: ConverterConfig) => void;
  matteColor: string;
}

const FORMATS: { value: OutputFormat; label: string; hint: string }[] = [
  { value: "webp", label: "WebP", hint: "Modern web format with alpha & compact size" },
  { value: "jpeg", label: "JPEG", hint: "Universal photo format (no transparency)" },
  { value: "png", label: "PNG", hint: "Sharp graphics & full alpha channel" },
];

export function ConverterPanel({
  config,
  onChange,
  matteColor,
}: ConverterPanelProps) {
  const supportsTransparency = config.format !== "jpeg";

  return (
    <div className="saas-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF3] pb-3.5 sm:mb-5 sm:pb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#09090B]">
            Conversion Parameters
          </h2>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Choose target format, quality curve, and optional dimension overrides.
          </p>
        </div>
        <span className="rounded-full bg-[#F4F4F6] px-2.5 py-1 text-[11px] font-medium text-[#52525B]">
          Output: <strong className="uppercase text-[#09090B]">{config.format}</strong>
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Output Format */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            Output Format
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1">
            {FORMATS.map((fmt) => {
              const active = config.format === fmt.value;
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      format: fmt.value,
                      preserveTransparency:
                        fmt.value === "jpeg"
                          ? false
                          : config.preserveTransparency,
                    })
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-[#09090B] shadow-xs ring-1 ring-black/[0.04]"
                      : "text-[#52525B] hover:text-[#09090B]"
                  }`}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#71717A]">
            {FORMATS.find((f) => f.value === config.format)?.hint}
          </p>
        </div>

        {/* Quality & Lossless */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="converter-quality"
              className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]"
            >
              Encoding Quality
            </label>
            <span className="tabular-nums rounded-md bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">
              {config.lossless && config.format !== "jpeg"
                ? "Lossless"
                : `${config.quality}%`}
            </span>
          </div>
          <input
            id="converter-quality"
            type="range"
            min={10}
            max={100}
            step={1}
            disabled={config.lossless && config.format !== "jpeg"}
            value={config.quality}
            onChange={(e) =>
              onChange({ ...config, quality: Number(e.target.value) })
            }
            className="w-full cursor-pointer disabled:opacity-40"
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-[#A1A1AA]">
            <span>10% Compact</span>
            <span>100% Maximum</span>
          </div>

          {config.format !== "jpeg" && (
            <label className="mt-3.5 flex cursor-pointer items-center gap-2 text-xs text-[#3F3F46]">
              <input
                type="checkbox"
                checked={config.lossless}
                onChange={(e) =>
                  onChange({ ...config, lossless: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#D4D4DC]"
              />
              <span>
                Lossless {config.format.toUpperCase()} for logos &amp; sharp UI
              </span>
            </label>
          )}
        </div>

        {/* Dimensions & Transparency */}
        <div className="space-y-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            Dimensions &amp; Alpha
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#18181B]">
            <input
              type="checkbox"
              checked={config.maintainOriginalDimensions}
              onChange={(e) =>
                onChange({
                  ...config,
                  maintainOriginalDimensions: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-[#D4D4DC]"
            />
            <span>Maintain original dimensions</span>
          </label>

          {!config.maintainOriginalDimensions && (
            <div className="space-y-2.5 rounded-xl border border-[#E7E7EC] bg-[#FAFAFB] p-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="conv-width"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Width (px)
                  </label>
                  <input
                    id="conv-width"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="Auto"
                    value={config.width}
                    onChange={(e) =>
                      onChange({ ...config, width: e.target.value })
                    }
                    className="tabular-nums w-full rounded-lg border border-[#D4D4DC] bg-white px-2.5 py-1.5 text-xs text-[#09090B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="conv-height"
                    className="mb-1 block text-[11px] font-medium text-[#52525B]"
                  >
                    Height (px)
                  </label>
                  <input
                    id="conv-height"
                    type="number"
                    min={1}
                    max={16384}
                    placeholder="Auto"
                    value={config.height}
                    onChange={(e) =>
                      onChange({ ...config, height: e.target.value })
                    }
                    className="tabular-nums w-full rounded-lg border border-[#D4D4DC] bg-white px-2.5 py-1.5 text-xs text-[#09090B]"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-[#3F3F46]">
                <input
                  type="checkbox"
                  checked={config.maintainAspectRatio}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      maintainAspectRatio: e.target.checked,
                    })
                  }
                  className="h-3.5 w-3.5 rounded"
                />
                <span>Lock aspect ratio</span>
              </label>

              {config.maintainAspectRatio && config.width && config.height && (
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#EFEFF3] p-0.5">
                  {(["contain", "cover"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChange({ ...config, fitMode: mode })}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                        config.fitMode === mode
                          ? "bg-white text-[#09090B] shadow-xs"
                          : "text-[#52525B]"
                      }`}
                    >
                      {mode === "contain" ? "Fit Inside" : "Crop to Fill"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <label
            className={`flex items-center gap-2 text-xs font-medium ${
              supportsTransparency
                ? "cursor-pointer text-[#18181B]"
                : "cursor-not-allowed text-[#A1A1AA]"
            }`}
          >
            <input
              type="checkbox"
              disabled={!supportsTransparency}
              checked={supportsTransparency && config.preserveTransparency}
              onChange={(e) =>
                onChange({
                  ...config,
                  preserveTransparency: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-[#D4D4DC]"
            />
            <span>Preserve transparency</span>
          </label>
          {(!supportsTransparency || !config.preserveTransparency) && (
            <p className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
              <span
                className="inline-block h-3 w-3 rounded border border-[#D4D4DC]"
                style={{ backgroundColor: matteColor }}
              />
              <span>
                Matte fill: {matteColor.toUpperCase()} (editable in Settings)
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
