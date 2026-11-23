export type OutputFormat = "webp" | "jpeg" | "png";

export type ResizeMode = "original" | "dimensions" | "percentage" | "max";

export type FitMode = "contain" | "cover" | "stretch";

export type WebpEngine = "auto" | "wasm" | "canvas";

export type StudioTab =
  | "converter"
  | "compressor"
  | "resizer"
  | "presets"
  | "settings";

export type ProcessingStatus =
  | "idle"
  | "queued"
  | "processing"
  | "done"
  | "error";

export interface ImageProcessingOptions {
  format: OutputFormat;
  /** Quality 10 - 100 */
  quality: number;
  /** Use lossless encoding (WebP lossless via libwebp WASM, or lossless PNG) */
  lossless: boolean;
  resizeMode: ResizeMode;
  width?: number;
  height?: number;
  /** Percentage 10 - 200 */
  percentage?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  fitMode: FitMode;
  preserveTransparency: boolean;
  backgroundColor: string;
  webpEngine: WebpEngine;
  filenameSuffix: string;
}

export interface ProcessedResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
  lossless: boolean;
  engineUsed: string;
  durationMs: number;
  outputFilename: string;
  downloaded: boolean;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalFormat: string;
  originalSize: number;
  width: number;
  height: number;
  hasTransparency: boolean;
  previewUrl: string;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  result?: ProcessedResult;
}

export interface OmiBayPreset {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
  recommendedFor: string;
  supportsLossless: boolean;
}

export interface StudioSettings {
  concurrency: number;
  webpEngine: WebpEngine;
  jpegMatteColor: string;
  filenameSuffix: string;
  warnOnLeave: boolean;
}

export interface BrowserCapabilities {
  canvasWebP: boolean;
  avifDecode: boolean;
  offscreenCanvas: boolean;
  webWorker: boolean;
  webAssembly: boolean;
}
