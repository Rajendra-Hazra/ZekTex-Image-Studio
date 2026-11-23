import { FitMode, OutputFormat, ResizeMode } from "@/types/image";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 100 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function calculateSavings(
  originalBytes: number,
  optimizedBytes: number
): { delta: number; percent: number; isSmaller: boolean } {
  if (originalBytes <= 0) {
    return { delta: 0, percent: 0, isSmaller: false };
  }
  const delta = originalBytes - optimizedBytes;
  const percent = (delta / originalBytes) * 100;
  return {
    delta,
    percent,
    isSmaller: delta > 0,
  };
}

export function formatExtension(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "webp";
    case "jpeg":
      return "jpg";
    case "png":
      return "png";
  }
}

export function buildOutputFilename(
  originalName: string,
  format: OutputFormat,
  suffix = ""
): string {
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const cleanBase = baseName.trim() || "image";
  const cleanSuffix = suffix.trim();
  return `${cleanBase}${cleanSuffix}.${formatExtension(format)}`;
}

export function deduplicateFilename(
  filename: string,
  used: Set<string>
): string {
  const lower = filename.toLowerCase();
  if (!used.has(lower)) {
    used.add(lower);
    return filename;
  }

  const lastDot = filename.lastIndexOf(".");
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.slice(lastDot) : "";

  let counter = 1;
  while (true) {
    const candidate = `${base} (${counter})${ext}`;
    const candidateLower = candidate.toLowerCase();
    if (!used.has(candidateLower)) {
      used.add(candidateLower);
      return candidate;
    }
    counter += 1;
  }
}

export function detectFormatLabel(file: File): string {
  const mime = file.type.toLowerCase();
  if (mime === "image/png") return "PNG";
  if (mime === "image/jpeg" || mime === "image/jpg") return "JPEG";
  if (mime === "image/webp") return "WebP";
  if (mime === "image/avif") return "AVIF";

  const ext = file.name.split(".").pop()?.toUpperCase();
  if (ext === "JPG" || ext === "JPEG") return "JPEG";
  if (ext === "PNG") return "PNG";
  if (ext === "WEBP") return "WebP";
  if (ext === "AVIF") return "AVIF";
  return ext || "Unknown";
}

export interface TargetGeometry {
  targetWidth: number;
  targetHeight: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Computes exact source crop and destination dimensions without unintended stretching.
 */
export function calculateTargetGeometry(
  srcWidth: number,
  srcHeight: number,
  params: {
    resizeMode: ResizeMode;
    width?: number;
    height?: number;
    percentage?: number;
    maxWidth?: number;
    maxHeight?: number;
    maintainAspectRatio: boolean;
    fitMode: FitMode;
  }
): TargetGeometry {
  const safeSrcW = Math.max(1, Math.round(srcWidth));
  const safeSrcH = Math.max(1, Math.round(srcHeight));
  const aspect = safeSrcW / safeSrcH;

  if (params.resizeMode === "original") {
    return {
      targetWidth: safeSrcW,
      targetHeight: safeSrcH,
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  if (params.resizeMode === "percentage") {
    const pct = Math.max(1, Math.min(400, params.percentage || 100)) / 100;
    return {
      targetWidth: Math.max(1, Math.round(safeSrcW * pct)),
      targetHeight: Math.max(1, Math.round(safeSrcH * pct)),
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  if (params.resizeMode === "max") {
    const maxW = params.maxWidth && params.maxWidth > 0 ? params.maxWidth : Infinity;
    const maxH = params.maxHeight && params.maxHeight > 0 ? params.maxHeight : Infinity;
    const scale = Math.min(1, maxW / safeSrcW, maxH / safeSrcH);
    return {
      targetWidth: Math.max(1, Math.round(safeSrcW * scale)),
      targetHeight: Math.max(1, Math.round(safeSrcH * scale)),
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  // resizeMode === "dimensions"
  const reqW = params.width && params.width > 0 ? Math.round(params.width) : undefined;
  const reqH = params.height && params.height > 0 ? Math.round(params.height) : undefined;

  if (!reqW && !reqH) {
    return {
      targetWidth: safeSrcW,
      targetHeight: safeSrcH,
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  if (reqW && !reqH) {
    return {
      targetWidth: reqW,
      targetHeight: params.maintainAspectRatio
        ? Math.max(1, Math.round(reqW / aspect))
        : safeSrcH,
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  if (!reqW && reqH) {
    return {
      targetWidth: params.maintainAspectRatio
        ? Math.max(1, Math.round(reqH * aspect))
        : safeSrcW,
      targetHeight: reqH,
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  // Both reqW and reqH provided
  const w = reqW!;
  const h = reqH!;

  if (!params.maintainAspectRatio || params.fitMode === "stretch") {
    return {
      targetWidth: w,
      targetHeight: h,
      sx: 0,
      sy: 0,
      sw: safeSrcW,
      sh: safeSrcH,
    };
  }

  if (params.fitMode === "cover") {
    // Center-crop source to exact target aspect ratio so output is exactly w x h without stretching
    const targetAspect = w / h;
    if (aspect > targetAspect) {
      const sw = Math.round(safeSrcH * targetAspect);
      const sx = Math.round((safeSrcW - sw) / 2);
      return {
        targetWidth: w,
        targetHeight: h,
        sx,
        sy: 0,
        sw,
        sh: safeSrcH,
      };
    } else {
      const sh = Math.round(safeSrcW / targetAspect);
      const sy = Math.round((safeSrcH - sh) / 2);
      return {
        targetWidth: w,
        targetHeight: h,
        sx: 0,
        sy,
        sw: safeSrcW,
        sh,
      };
    }
  }

  // fitMode === "contain": fit inside w x h while preserving aspect ratio (no stretching, no cropping)
  const scale = Math.min(w / safeSrcW, h / safeSrcH);
  return {
    targetWidth: Math.max(1, Math.round(safeSrcW * scale)),
    targetHeight: Math.max(1, Math.round(safeSrcH * scale)),
    sx: 0,
    sy: 0,
    sw: safeSrcW,
    sh: safeSrcH,
  };
}
