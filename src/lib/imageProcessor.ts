import UPNG from "upng-js";
import {
  ImageItem,
  ImageProcessingOptions,
  ProcessedResult,
} from "@/types/image";
import {
  buildOutputFilename,
  calculateTargetGeometry,
  detectFormatLabel,
} from "@/lib/format";
import type {
  WorkerProcessRequest,
  WorkerProcessResponse,
} from "@/lib/imageWorker";

const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
]);

const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "avif"]);

export function isSupportedImageFile(file: File): boolean {
  if (file.type && ACCEPTED_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  return Boolean(ext && ACCEPTED_EXTENSIONS.has(ext));
}

function detectTransparency(img: HTMLImageElement, formatLabel: string): boolean {
  if (formatLabel === "JPEG") return false;
  try {
    const sampleSize = 64;
    const canvas = document.createElement("canvas");
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    canvas.width = 0;
    canvas.height = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function createImageItemFromFile(file: File): Promise<ImageItem> {
  if (!isSupportedImageFile(file)) {
    throw new Error(
      `"${file.name}" is not a supported image format. Use PNG, JPG, JPEG, WebP, or AVIF.`
    );
  }

  const previewUrl = URL.createObjectURL(file);

  try {
    const { width, height, hasTransparency } = await new Promise<{
      width: number;
      height: number;
      hasTransparency: boolean;
    }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const formatLabel = detectFormatLabel(file);
        const transparent = detectTransparency(img, formatLabel);
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          hasTransparency: transparent,
        });
      };
      img.onerror = () => {
        const formatLabel = detectFormatLabel(file);
        if (formatLabel === "AVIF") {
          reject(
            new Error(
              `Your browser could not decode AVIF file "${file.name}".`
            )
          );
        } else {
          reject(
            new Error(
              `Could not decode "${file.name}". The file may be corrupted or unsupported.`
            )
          );
        }
      };
      img.src = previewUrl;
    });

    return {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      file,
      name: file.name,
      originalFormat: detectFormatLabel(file),
      originalSize: file.size,
      width,
      height,
      hasTransparency,
      previewUrl,
      status: "idle",
      progress: 0,
    };
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    throw err;
  }
}

async function encodeWebPWithWasmMainThread(
  imageData: ImageData,
  quality: number,
  lossless: boolean
): Promise<Blob> {
  const { default: encodeWebP } = await import("@jsquash/webp/encode");
  const buffer = await encodeWebP(imageData, {
    quality: Math.max(10, Math.min(100, quality)),
    lossless: lossless ? 1 : 0,
  });
  return new Blob([buffer], { type: "image/webp" });
}

function qualityToPngPaletteSize(quality: number): number {
  const clamped = Math.max(10, Math.min(99, quality));
  const ratio = (clamped - 10) / 89;
  return Math.max(16, Math.min(256, Math.round(16 + ratio * 240)));
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Browser failed to encode ${mimeType}.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function processOnMainThread(
  file: File,
  options: ImageProcessingOptions
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  engineUsed: string;
  durationMs: number;
}> {
  const startedAt = performance.now();
  const tempUrl = URL.createObjectURL(file);
  const canvas = document.createElement("canvas");

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error(`Unable to load "${file.name}" for processing.`));
      el.src = tempUrl;
    });

    const geometry = calculateTargetGeometry(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      {
        resizeMode: options.resizeMode,
        width: options.width,
        height: options.height,
        percentage: options.percentage,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        maintainAspectRatio: options.maintainAspectRatio,
        fitMode: options.fitMode,
      }
    );

    const { targetWidth, targetHeight, sx, sy, sw, sh } = geometry;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", {
      alpha: options.format !== "jpeg" && options.preserveTransparency,
      willReadFrequently: true,
    });

    if (!ctx) {
      throw new Error("Could not initialize 2D canvas context.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (options.format === "jpeg" || !options.preserveTransparency) {
      ctx.fillStyle = options.backgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

    const qualityFraction = Math.max(0.1, Math.min(1, options.quality / 100));
    let blob: Blob;
    let engineUsed = "Canvas API";

    if (options.format === "jpeg") {
      blob = await canvasToBlob(canvas, "image/jpeg", qualityFraction);
      engineUsed = "Canvas API (JPEG)";
    } else if (options.format === "png") {
      if (options.lossless || options.quality >= 100) {
        blob = await canvasToBlob(canvas, "image/png");
        engineUsed = "Canvas API (Lossless PNG)";
      } else {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const paletteColors = qualityToPngPaletteSize(options.quality);
        const encoded = UPNG.encode(
          [imageData.data.buffer],
          targetWidth,
          targetHeight,
          paletteColors
        );
        blob = new Blob([encoded], { type: "image/png" });
        engineUsed = `UPNG Quantizer (${paletteColors} colors)`;
      }
    } else {
      const shouldTryWasmFirst =
        options.webpEngine === "wasm" ||
        (options.webpEngine === "auto" && options.lossless);

      if (shouldTryWasmFirst) {
        try {
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          blob = await encodeWebPWithWasmMainThread(
            imageData,
            options.quality,
            options.lossless
          );
          engineUsed = options.lossless
            ? "libwebp WebAssembly (Lossless)"
            : "libwebp WebAssembly";
        } catch {
          blob = await canvasToBlob(
            canvas,
            "image/webp",
            options.lossless ? 1 : qualityFraction
          );
          engineUsed = "Canvas API (WebP fallback)";
        }
      } else {
        const canvasBlob = await canvasToBlob(
          canvas,
          "image/webp",
          qualityFraction
        );
        if (canvasBlob.type === "image/webp") {
          blob = canvasBlob;
          engineUsed = "Canvas API (WebP)";
        } else {
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          blob = await encodeWebPWithWasmMainThread(
            imageData,
            options.quality,
            options.lossless
          );
          engineUsed = "libwebp WebAssembly";
        }
      }
    }

    const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
    return {
      blob,
      width: targetWidth,
      height: targetHeight,
      engineUsed,
      durationMs,
    };
  } finally {
    URL.revokeObjectURL(tempUrl);
    canvas.width = 0;
    canvas.height = 0;
  }
}

function runSingleWorkerTask(
  id: string,
  file: File,
  options: ImageProcessingOptions
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  engineUsed: string;
  durationMs: number;
}> {
  return new Promise((resolve, reject) => {
    if (
      typeof Worker === "undefined" ||
      typeof OffscreenCanvas === "undefined"
    ) {
      reject(new Error("OFFSCREEN_UNSUPPORTED"));
      return;
    }

    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL("./imageWorker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      reject(new Error("OFFSCREEN_UNSUPPORTED"));
      return;
    }

    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    worker.onmessage = (event: MessageEvent<WorkerProcessResponse>) => {
      const data = event.data;
      cleanup();
      if (data.ok) {
        resolve({
          blob: data.blob,
          width: data.width,
          height: data.height,
          engineUsed: data.engineUsed,
          durationMs: data.durationMs,
        });
      } else {
        reject(new Error(data.error));
      }
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error("OFFSCREEN_UNSUPPORTED"));
    };

    const request: WorkerProcessRequest = { id, file, options };
    worker.postMessage(request);
  });
}

export async function processSingleImage(
  item: ImageItem,
  options: ImageProcessingOptions
): Promise<ProcessedResult> {
  let rawResult: {
    blob: Blob;
    width: number;
    height: number;
    engineUsed: string;
    durationMs: number;
  };

  try {
    rawResult = await runSingleWorkerTask(item.id, item.file, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "OFFSCREEN_UNSUPPORTED") {
      rawResult = await processOnMainThread(item.file, options);
    } else {
      throw err;
    }
  }

  const outputFilename = buildOutputFilename(
    item.name,
    options.format,
    options.filenameSuffix
  );
  const url = URL.createObjectURL(rawResult.blob);

  return {
    blob: rawResult.blob,
    url,
    size: rawResult.blob.size,
    width: rawResult.width,
    height: rawResult.height,
    format: options.format,
    quality: options.quality,
    lossless: options.lossless,
    engineUsed: rawResult.engineUsed,
    durationMs: rawResult.durationMs,
    outputFilename,
    downloaded: false,
  };
}

/**
 * Processes a batch of images with controlled concurrency to avoid memory exhaustion.
 */
export async function processImageBatch(
  items: ImageItem[],
  optionsResolver: (item: ImageItem) => ImageProcessingOptions,
  concurrency: number,
  callbacks: {
    onStart: (id: string) => void;
    onSuccess: (id: string, result: ProcessedResult) => void;
    onError: (id: string, error: string) => void;
  }
): Promise<void> {
  const safeConcurrency = Math.max(1, Math.min(4, Math.round(concurrency)));
  let nextIndex = 0;

  async function workerLoop() {
    while (nextIndex < items.length) {
      const current = items[nextIndex];
      nextIndex += 1;
      if (!current) break;

      callbacks.onStart(current.id);
      try {
        const opts = optionsResolver(current);
        const result = await processSingleImage(current, opts);
        callbacks.onSuccess(current.id, result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process image.";
        callbacks.onError(current.id, message);
      }
    }
  }

  const runners = Array.from(
    { length: Math.min(safeConcurrency, items.length) },
    () => workerLoop()
  );
  await Promise.all(runners);
}
