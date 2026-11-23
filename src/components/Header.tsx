"use client";

import React from "react";
import {
  ArrowLeftRight,
  Minimize2,
  Maximize2,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { StudioTab } from "@/types/image";

interface HeaderProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  imageCount: number;
}

const NAV_ITEMS: {
  id: StudioTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "converter",
    label: "Converter",
    shortLabel: "Convert",
    icon: ArrowLeftRight,
  },
  {
    id: "compressor",
    label: "Compressor",
    shortLabel: "Compress",
    icon: Minimize2,
  },
  {
    id: "resizer",
    label: "Resizer",
    shortLabel: "Resize",
    icon: Maximize2,
  },
  {
    id: "presets",
    label: "OmiBay Presets",
    shortLabel: "OmiBay",
    icon: Layers,
  },
  {
    id: "settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: SlidersHorizontal,
  },
];

export function Header({ activeTab, onSelectTab, imageCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E7E7EC]/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3.5 sm:h-16 sm:px-6">
        {/* Brand mark */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111113] text-white shadow-xs"
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6.5C4 5.11929 5.11929 4 6.5 4H17.5C18.8807 4 20 5.11929 20 6.5V17.5C20 18.8807 18.8807 20 17.5 20H6.5C5.11929 20 4 18.8807 4 17.5V6.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8.5 9H15.5L8.5 15H15.5"
                stroke="#818CF8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#09090B]">
              ZekTex Studio
            </h1>
            <span className="hidden rounded-md bg-[#F4F4F6] px-1.5 py-0.5 text-[11px] font-medium text-[#52525B] md:inline-block">
              Image Engine
            </span>
          </div>
        </div>

        {/* Center Segmented Navigation (Desktop) */}
        <nav
          aria-label="Studio modules"
          className="hidden items-center gap-0.5 rounded-xl border border-[#E7E7EC] bg-[#F4F4F6] p-1 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white text-[#09090B] shadow-xs ring-1 ring-black/[0.04]"
                    : "text-[#52525B] hover:text-[#09090B]"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-[#4F46E5]" : "text-[#71717A]"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Counter */}
        <div className="flex shrink-0 items-center gap-2">
          {imageCount > 0 && (
            <span className="tabular-nums inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#4F46E5]">
              {imageCount} {imageCount === 1 ? "asset" : "assets"}
            </span>
          )}
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E7EC] bg-white px-2.5 py-1 text-[11px] font-medium text-[#3F3F46] sm:gap-2 sm:px-3 sm:text-xs"
            title="All image processing runs locally inside your browser. Zero files are uploaded."
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden xs:inline sm:inline">Local Only</span>
            <span className="sm:hidden">Local</span>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Bar */}
      <nav
        aria-label="Studio modules mobile"
        className="border-t border-[#EFEFF3] bg-[#FAFAFB] px-3 py-2 lg:hidden"
      >
        <div className="no-scrollbar mx-auto flex max-w-7xl snap-x items-center gap-1.5 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-[36px] shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#111113] text-white shadow-xs"
                    : "border border-[#E7E7EC] bg-white text-[#52525B] hover:text-[#09090B]"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-[#818CF8]" : "text-[#71717A]"
                  }`}
                />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
