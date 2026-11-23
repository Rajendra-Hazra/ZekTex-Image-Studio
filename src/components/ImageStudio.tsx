"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  BrowserCapabilities,
  ImageItem,
  ImageProcessingOptions,
  OutputFormat,
  StudioSettings,
  StudioTab,
} from "@/types/image";
import { DEFAULT_STUDIO_SETTINGS, OMIBAY_PRESETS } from "@/lib/presets";
import { detectBrowserCapabilities } from "@/lib/capabilities";
import {
  createImageItemFromFile,
  processImageBatch,
  processSingleImage,
} from "@/lib/imageProcessor";
import { downloadBatchAsZip, downloadBlob } from "@/lib/zipDownload";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { ImageQueueList } from "@/components/ImageQueueList";
import {
  ConverterConfig,
  ConverterPanel,
} from "@/components/ConverterPanel";
import {
  CompressorConfig,
  CompressorPanel,
} from "@/components/CompressorPanel";
import { ResizerConfig, ResizerPanel } from "@/components/ResizerPanel";
import {
  OmiBayPresetConfig,
  OmiBayPresetsPanel,
} from "@/components/OmiBayPresetsPanel";

const ComparisonModal = dynamic(
  () =>
    import("@/components/ComparisonModal").then((mod) => mod.ComparisonModal),
  { ssr: false }
);

const SettingsPanel = dynamic(
  () => import("@/components/SettingsPanel").then((mod) => mod.SettingsPanel),
  { ssr: false }
);

interface NoticeBanner {
  type: "success" | "error" | "info";
  message: string;
}

const TAB_META: Record<StudioTab, { title: string; subtitle: string }> = {
  converter: {
    title: "Image Converter",
    subtitle:
      "Transcode PNG, JPG, WebP, and AVIF assets locally using Browser Canvas & libwebp WebAssembly.",
  },
  compressor: {
    title: "Image Compressor",
    subtitle:
      "Reduce asset payload sizes with real-time visual inspection and measured compression deltas.",
  },
  resizer: {
    title: "Image Resizer",
    subtitle:
      "Resize by exact dimensions, percentage scale, or max bounds while preserving proportions.",
  },
  presets: {
    title: "OmiBay Presets",
    subtitle:
      "Production-ready optimization profiles tailored for OmiBay and DYUTI storefront assets.",
  },
  settings: {
    title: "Studio Settings",
    subtitle:
      "Configure local Web Worker concurrency, encoding backend, and export defaults.",
  },
};

function originalFormatToOutputFormat(originalFormat: string): OutputFormat {
  const lower = originalFormat.toLowerCase();
  if (lower === "png") return "png";
  if (lower === "jpeg" || lower === "jpg") return "jpeg";
  return "webp";
}

export function ImageStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("converter");
  const [items, setItems] = useState<ImageItem[]>([]);
  const itemsRef = useRef<ImageItem[]>([]);
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(
    null
  );
  const [settings, setSettings] = useState<StudioSettings>({
    ...DEFAULT_STUDIO_SETTINGS,
  });

  // Module configurations
  const [converterConfig, setConverterConfig] = useState<ConverterConfig>({
    format: "webp",
    quality: 80,
    lossless: false,
    maintainOriginalDimensions: true,
    width: "",
    height: "",
    maintainAspectRatio: true,
    fitMode: "contain",
    preserveTransparency: true,
  });

  const [compressorConfig, setCompressorConfig] = useState<CompressorConfig>({
    keepOriginalFormat: true,
    targetFormat: "webp",
    quality: 75,
  });

  const [resizerConfig, setResizerConfig] = useState<ResizerConfig>({
    mode: "dimensions",
    width: "800",
    height: "400",
    percentage: 50,
    maxWidth: "1200",
    maxHeight: "1200",
    maintainAspectRatio: true,
    fitMode: "contain",
    format: "original",
    quality: 82,
  });

  const [presetConfig, setPresetConfig] = useState<OmiBayPresetConfig>({
    presetId: OMIBAY_PRESETS[0].id,
    width: OMIBAY_PRESETS[0].width,
    height: OMIBAY_PRESETS[0].height,
    format: OMIBAY_PRESETS[0].format,
    quality: OMIBAY_PRESETS[0].quality,
    lossless: false,
    fitMode: "cover",
    preserveTransparency: true,
  });

  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeBanner | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Detect browser capabilities once on mount
  useEffect(() => {
    let active = true;
    detectBrowserCapabilities().then((caps) => {
      if (active) setCapabilities(caps);
    });
    return () => {
      active = false;
    };
  }, []);

  // Revoke all remaining object URLs on unmount
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) {
          URL.revokeObjectURL(item.result.url);
        }
      }
    };
  }, []);

  // Warn user before leaving if there are un-downloaded processed images
  useEffect(() => {
    if (!settings.warnOnLeave) return;
    const hasUndownloaded = items.some(
      (item) => item.status === "done" && item.result && !item.result.downloaded
    );
    if (!hasUndownloaded) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "You have processed images that have not been downloaded yet. Leaving this page will lose them.";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items, settings.warnOnLeave]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setNotice(null);

    const added: ImageItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const item = await createImageItemFromFile(file);
        added.push(item);
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : `Failed to read "${file.name}".`
        );
      }
    }

    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
    }

    if (errors.length > 0) {
      setNotice({
        type: "error",
        message:
          errors.length === 1
            ? errors[0]
            : `${errors.length} file(s) skipped: ${errors[0]}`,
      });
    } else if (added.length > 0) {
      setNotice({
        type: "info",
        message: `Loaded ${added.length} ${added.length === 1 ? "asset" : "assets"} into local browser memory.`,
      });
    }
  }, []);

  const buildOptionsForItem = useCallback(
    (item: ImageItem): ImageProcessingOptions => {
      if (activeTab === "compressor") {
        const format = compressorConfig.keepOriginalFormat
          ? originalFormatToOutputFormat(item.originalFormat)
          : compressorConfig.targetFormat;
        return {
          format,
          quality: compressorConfig.quality,
          lossless: false,
          resizeMode: "original",
          maintainAspectRatio: true,
          fitMode: "contain",
          preserveTransparency: format !== "jpeg",
          backgroundColor: settings.jpegMatteColor,
          webpEngine: settings.webpEngine,
          filenameSuffix: settings.filenameSuffix,
        };
      }

      if (activeTab === "resizer") {
        const format =
          resizerConfig.format === "original"
            ? originalFormatToOutputFormat(item.originalFormat)
            : resizerConfig.format;
        return {
          format,
          quality: resizerConfig.quality,
          lossless: format === "png" && resizerConfig.quality >= 100,
          resizeMode: resizerConfig.mode,
          width: resizerConfig.width ? Number(resizerConfig.width) : undefined,
          height: resizerConfig.height
            ? Number(resizerConfig.height)
            : undefined,
          percentage: resizerConfig.percentage,
          maxWidth: resizerConfig.maxWidth
            ? Number(resizerConfig.maxWidth)
            : undefined,
          maxHeight: resizerConfig.maxHeight
            ? Number(resizerConfig.maxHeight)
            : undefined,
          maintainAspectRatio: resizerConfig.maintainAspectRatio,
          fitMode: resizerConfig.fitMode,
          preserveTransparency: format !== "jpeg",
          backgroundColor: settings.jpegMatteColor,
          webpEngine: settings.webpEngine,
          filenameSuffix: settings.filenameSuffix,
        };
      }

      if (activeTab === "presets") {
        return {
          format: presetConfig.format,
          quality: presetConfig.quality,
          lossless: presetConfig.lossless,
          resizeMode: "dimensions",
          width: presetConfig.width,
          height: presetConfig.height,
          maintainAspectRatio: true,
          fitMode: presetConfig.fitMode,
          preserveTransparency:
            presetConfig.format !== "jpeg" && presetConfig.preserveTransparency,
          backgroundColor: settings.jpegMatteColor,
          webpEngine: settings.webpEngine,
          filenameSuffix: settings.filenameSuffix,
        };
      }

      return {
        format: converterConfig.format,
        quality: converterConfig.quality,
        lossless:
          converterConfig.format !== "jpeg" && converterConfig.lossless,
        resizeMode: converterConfig.maintainOriginalDimensions
          ? "original"
          : "dimensions",
        width: converterConfig.width
          ? Number(converterConfig.width)
          : undefined,
        height: converterConfig.height
          ? Number(converterConfig.height)
          : undefined,
        maintainAspectRatio: converterConfig.maintainAspectRatio,
        fitMode: converterConfig.fitMode,
        preserveTransparency:
          converterConfig.format !== "jpeg" &&
          converterConfig.preserveTransparency,
        backgroundColor: settings.jpegMatteColor,
        webpEngine: settings.webpEngine,
        filenameSuffix: settings.filenameSuffix,
      };
    },
    [
      activeTab,
      compressorConfig,
      converterConfig,
      presetConfig,
      resizerConfig,
      settings,
    ]
  );

  const handleProcessOne = useCallback(
    async (id: string) => {
      const target = itemsRef.current.find((it) => it.id === id);
      if (!target) return;

      setNotice(null);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: "processing", error: undefined }
            : it
        )
      );

      try {
        const opts = buildOptionsForItem(target);
        const result = await processSingleImage(target, opts);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            if (it.result?.url) {
              URL.revokeObjectURL(it.result.url);
            }
            return {
              ...it,
              status: "done",
              progress: 100,
              error: undefined,
              result,
            };
          })
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process image.";
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, status: "error", error: message } : it
          )
        );
        setNotice({ type: "error", message });
      }
    },
    [buildOptionsForItem]
  );

  const handleProcessAll = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setNotice(null);

    setItems((prev) =>
      prev.map((it) => ({ ...it, status: "queued", error: undefined }))
    );

    let successCount = 0;
    let errorCount = 0;

    await processImageBatch(
      currentItems,
      buildOptionsForItem,
      settings.concurrency,
      {
        onStart: (id) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === id ? { ...it, status: "processing" } : it
            )
          );
        },
        onSuccess: (id, result) => {
          successCount += 1;
          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== id) return it;
              if (it.result?.url) {
                URL.revokeObjectURL(it.result.url);
              }
              return {
                ...it,
                status: "done",
                progress: 100,
                error: undefined,
                result,
              };
            })
          );
        },
        onError: (id, error) => {
          errorCount += 1;
          setItems((prev) =>
            prev.map((it) =>
              it.id === id ? { ...it, status: "error", error } : it
            )
          );
        },
      }
    );

    setIsProcessingBatch(false);
    setNotice({
      type: errorCount > 0 ? "error" : "success",
      message:
        errorCount > 0
          ? `Processed ${successCount} asset(s) with ${errorCount} error(s).`
          : `Successfully processed ${successCount} ${successCount === 1 ? "asset" : "assets"} locally.`,
    });
  }, [buildOptionsForItem, isProcessingBatch, settings.concurrency]);

  const handleDownloadOne = useCallback((item: ImageItem) => {
    if (!item.result) return;
    downloadBlob(item.result.blob, item.result.outputFilename);
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id && it.result
          ? { ...it, result: { ...it.result, downloaded: true } }
          : it
      )
    );
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (zipProgress !== null) return;
    setZipProgress(0);
    try {
      const count = await downloadBatchAsZip(itemsRef.current, (pct) => {
        setZipProgress(pct);
      });
      if (count > 0) {
        setItems((prev) =>
          prev.map((it) =>
            it.result
              ? { ...it, result: { ...it.result, downloaded: true } }
              : it
          )
        );
        setNotice({
          type: "success",
          message: `Exported ZIP archive with ${count} optimized ${count === 1 ? "asset" : "assets"}.`,
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to generate ZIP archive.",
      });
    } finally {
      setZipProgress(null);
    }
  }, [zipProgress]);

  const handleRemoveOne = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result?.url) {
          URL.revokeObjectURL(target.result.url);
        }
      }
      return prev.filter((it) => it.id !== id);
    });
    setCompareItemId((prev) => (prev === id ? null : prev));
  }, []);

  const handleClearAll = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) {
          URL.revokeObjectURL(item.result.url);
        }
      }
      return [];
    });
    setCompareItemId(null);
    setNotice(null);
  }, []);

  const compareItem = compareItemId
    ? items.find((it) => it.id === compareItemId) ?? null
    : null;

  const actionLabel =
    activeTab === "compressor"
      ? "Compress"
      : activeTab === "resizer"
        ? "Resize"
        : activeTab === "presets"
          ? "Apply Preset"
          : "Convert";

  const tabMeta = TAB_META[activeTab];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFB] text-[#09090B]">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        imageCount={items.length}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-3.5 py-5 sm:space-y-5 sm:px-6 sm:py-8">
        {/* Clean SaaS Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#09090B] sm:text-2xl">
              {tabMeta.title}
            </h2>
            <p className="mt-0.5 text-xs text-[#71717A] sm:mt-1 sm:text-sm">
              {tabMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Status / Notification Banner */}
        {notice && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xs ${
              notice.type === "error"
                ? "border-red-200 bg-red-50/90 text-red-700"
                : notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
                  : "border-[#E7E7EC] bg-white text-[#18181B]"
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : notice.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-[#4F46E5]" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
              className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Active Workspace Controls */}
        {activeTab === "converter" && (
          <ConverterPanel
            config={converterConfig}
            onChange={setConverterConfig}
            matteColor={settings.jpegMatteColor}
          />
        )}

        {activeTab === "compressor" && (
          <CompressorPanel
            config={compressorConfig}
            onChange={setCompressorConfig}
            items={items}
            onDownloadOne={handleDownloadOne}
            onCompare={(item) => setCompareItemId(item.id)}
          />
        )}

        {activeTab === "resizer" && (
          <ResizerPanel
            config={resizerConfig}
            onChange={setResizerConfig}
            sampleItem={items[0]}
          />
        )}

        {activeTab === "presets" && (
          <OmiBayPresetsPanel
            config={presetConfig}
            onChange={setPresetConfig}
            sampleItem={items[0]}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            capabilities={capabilities}
          />
        )}

        {/* Upload Zone & Batch Queue */}
        {activeTab !== "settings" && (
          <>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              avifSupported={capabilities?.avifDecode ?? true}
              compact={items.length > 0}
              disabled={isProcessingBatch}
            />

            <ImageQueueList
              items={items}
              isProcessingBatch={isProcessingBatch}
              zipProgress={zipProgress}
              actionLabel={actionLabel}
              onProcessOne={handleProcessOne}
              onProcessAll={handleProcessAll}
              onCompare={(item) => setCompareItemId(item.id)}
              onDownloadOne={handleDownloadOne}
              onDownloadZip={handleDownloadZip}
              onRemoveOne={handleRemoveOne}
              onClearAll={handleClearAll}
            />
          </>
        )}
      </main>

      <footer className="mt-8 border-t border-[#E7E7EC] bg-white py-5 sm:mt-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-[#71717A] sm:flex-row sm:px-6 sm:text-left">
          <p>
            <strong className="font-semibold text-[#09090B]">
              ZekTex Image Studio
            </strong>{" "}
            &middot; ZekTex Pvt. Ltd. Internal Productivity Platform
          </p>
          <p>
            Powered by Browser Canvas API &amp; libwebp WebAssembly &middot;
            Zero server uploads
          </p>
        </div>
      </footer>

      <ComparisonModal
        item={compareItem}
        onClose={() => setCompareItemId(null)}
        onDownload={handleDownloadOne}
      />
    </div>
  );
}
