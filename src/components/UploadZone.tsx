"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Plus, Lock } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  avifSupported: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function UploadZone({
  onFilesSelected,
  avifSupported,
  compact = false,
  disabled = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptAttr = avifSupported
    ? "image/png,image/jpeg,image/webp,image/avif,.png,.jpg,.jpeg,.webp,.avif"
    : "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

  const formats = avifSupported
    ? ["PNG", "JPG", "JPEG", "WebP", "AVIF"]
    : ["PNG", "JPG", "JPEG", "WebP"];

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const triggerFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      role="region"
      aria-label="Image upload dropzone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative overflow-hidden rounded-2xl border border-dashed transition-all ${
        isDragging
          ? "border-[#4F46E5] bg-[#EEF2FF]/60 ring-4 ring-[#4F46E5]/10"
          : "border-[#D4D4DC] bg-white hover:border-[#A1A1AA]"
      } ${compact ? "px-4 py-3.5 sm:px-5" : "dot-grid px-4 py-9 sm:px-6 sm:py-12"} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptAttr}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {compact ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7E7EC] bg-[#FAFAFB] text-[#4F46E5]">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#09090B]">
                Add more images to queue
              </p>
              <p className="text-xs text-[#71717A]">
                Supports {formats.join(", ")} &middot; Batch ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerFilePicker}
            disabled={disabled}
            className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#111113] px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#27272A] disabled:opacity-50 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Images</span>
          </button>
        </div>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E7E7EC] bg-white text-[#4F46E5] shadow-xs">
            <UploadCloud className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-[#09090B]">
            Drop your images here
          </h2>
          <p className="mt-1 text-sm text-[#52525B]">
            Upload one or multiple assets for instant local optimization.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="rounded-md border border-[#E7E7EC] bg-white px-2 py-0.5 text-[11px] font-medium text-[#52525B]"
              >
                {fmt}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={triggerFilePicker}
            disabled={disabled}
            className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#111113] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-all hover:bg-[#27272A] active:scale-[0.99] disabled:opacity-50 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Select Files from Device</span>
          </button>

          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#71717A]">
            <Lock className="h-3 w-3 shrink-0 text-[#4F46E5]" />
            <span>Private by design — files never leave your browser</span>
          </p>
        </div>
      )}
    </div>
  );
}
