/// <reference lib="webworker" />

import UPNG from "upng-js";
import { ImageProcessingOptions } from "@/types/image";
import { calculateTargetGeometry } from "@/lib/format";

export interface WorkerProcessRequest {
  id: string;
  file: File;
  options: ImageProcessingOptions;
}

export interface WorkerProcessSuccess {
  id: string;
  ok: true;
  blob: Blob;
  width: number;
  height: number;
  engineUsed: string;
  durationMs: number;
}

export interface WorkerProcessError {
  id: string;
  ok: false;
  error: string;
}

export type WorkerProcessResponse = WorkerProcessSuccess | WorkerProcessError;

async function encodeWebPWithWasm(
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
  // Map quality 10..99 to 16..256 palette colors for genuine lossy PNG compression
  const clamped = Math.max(10, Math.min(99, quality));
  const ratio = (clamped - 10) / 89;
  return Math.max(16, Math.min(256, Math.round(16 + ratio * 240)));
}

async function processInWorker(
  file: File,
  options: ImageProcessingOptions
): Promise<Omit<WorkerProcessSuccess, "id" | "ok">> {
  const startedAt = performance.now();

  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("OFFSCREEN_UNSUPPORTED");
  }

  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;

  try {
    bitmap = await createImageBitmap(file);
    const geometry = calculateTargetGeometry(bitmap.width, bitmap.height, {
      resizeMode: options.resizeMode,
      width: options.width,
      height: options.height,
      percentage: options.percentage,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      maintainAspectRatio: options.maintainAspectRatio,
      fitMode: options.fitMode,
    });

    const { targetWidth, targetHeight, sx, sy, sw, sh } = geometry;

    // Guard against extreme canvas allocation sizes that crash browsers
    const MAX_CANVAS_SIDE = 16384;
    const MAX_CANVAS_PIXELS = 67_108_864; // ~67 MP
    if (
      targetWidth > MAX_CANVAS_SIDE ||
      targetHeight > MAX_CANVAS_SIDE ||
      targetWidth * targetHeight > MAX_CANVAS_PIXELS
    ) {
      throw new Error(
        `Target dimensions (${targetWidth} × ${targetHeight}) exceed safe browser memory limits.`
      );
    }

    canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d", {
      alpha: options.format !== "jpeg" && options.preserveTransparency,
      willReadFrequently: true,
    });

    if (!ctx) {
      throw new Error("Could not initialize 2D rendering context.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const needsMatteFill =
      options.format === "jpeg" || !options.preserveTransparency;
    if (needsMatteFill) {
      ctx.fillStyle = options.backgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

    // Release source bitmap immediately
    bitmap.close();
    bitmap = null;

    const qualityFraction = Math.max(0.1, Math.min(1, options.quality / 100));
    let blob: Blob;
    let engineUsed = "Canvas API";

    if (options.format === "jpeg") {
      blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: qualityFraction,
      });
      engineUsed = "Canvas API (JPEG)";
    } else if (options.format === "png") {
      if (options.lossless || options.quality >= 100) {
        blob = await canvas.convertToBlob({ type: "image/png" });
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
      // WebP output
      const shouldTryWasmFirst =
        options.webpEngine === "wasm" ||
        (options.webpEngine === "auto" && options.lossless);

      if (shouldTryWasmFirst) {
        try {
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          blob = await encodeWebPWithWasm(
            imageData,
            options.quality,
            options.lossless
          );
          engineUsed = options.lossless
            ? "libwebp WebAssembly (Lossless)"
            : "libwebp WebAssembly";
        } catch {
          // Graceful fallback to native Canvas WebP encoder
          blob = await canvas.convertToBlob({
            type: "image/webp",
            quality: options.lossless ? 1 : qualityFraction,
          });
          engineUsed = "Canvas API (WebP fallback)";
        }
      } else {
        const canvasBlob = await canvas.convertToBlob({
          type: "image/webp",
          quality: qualityFraction,
        });
        if (canvasBlob.type === "image/webp") {
          blob = canvasBlob;
          engineUsed = "Canvas API (WebP)";
        } else {
          // Browser doesn't support native WebP export; fall back to libwebp WASM
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          blob = await encodeWebPWithWasm(
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
    if (bitmap) {
      bitmap.close();
    }
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

self.onmessage = async (event: MessageEvent<WorkerProcessRequest>) => {
  const { id, file, options } = event.data;
  try {
    const result = await processInWorker(file, options);
    const response: WorkerProcessSuccess = {
      id,
      ok: true,
      ...result,
    };
    self.postMessage(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected image processing error.";
    const response: WorkerProcessError = {
      id,
      ok: false,
      error: message,
    };
    self.postMessage(response);
  }
};
