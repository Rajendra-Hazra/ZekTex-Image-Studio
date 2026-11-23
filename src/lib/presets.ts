import { OmiBayPreset } from "@/types/image";

export const OMIBAY_PRESETS: OmiBayPreset[] = [
  {
    id: "omibay-hero-banner",
    name: "Hero Banner",
    description: "Homepage and promotional widescreen banners for OmiBay.",
    width: 800,
    height: 400,
    format: "webp",
    quality: 75,
    recommendedFor: "Hero sliders, campaign headers, featured banners",
    supportsLossless: false,
  },
  {
    id: "omibay-category",
    name: "Category Image",
    description: "Primary service and product category square thumbnails.",
    width: 300,
    height: 300,
    format: "webp",
    quality: 65,
    recommendedFor: "Top-level category cards & storefront grids",
    supportsLossless: true,
  },
  {
    id: "omibay-subcategory",
    name: "Subcategory Image",
    description: "Compact subcategory visual cards for quick browsing.",
    width: 200,
    height: 200,
    format: "webp",
    quality: 60,
    recommendedFor: "Subcategory listings & mobile menus",
    supportsLossless: true,
  },
  {
    id: "omibay-service-icon",
    name: "Service Problem Icon",
    description: "Crisp compact icons for service issues and diagnostics.",
    width: 128,
    height: 128,
    format: "webp",
    quality: 55,
    recommendedFor: "Problem icons, badges, sharp UI graphics",
    supportsLossless: true,
  },
];

export interface QuickResizePreset {
  label: string;
  width: number;
  height: number;
}

export const QUICK_RESIZE_PRESETS: QuickResizePreset[] = [
  { label: "128 × 128", width: 128, height: 128 },
  { label: "150 × 150", width: 150, height: 150 },
  { label: "200 × 200", width: 200, height: 200 },
  { label: "300 × 300", width: 300, height: 300 },
  { label: "400 × 400", width: 400, height: 400 },
  { label: "800 × 400", width: 800, height: 400 },
];

export const DEFAULT_STUDIO_SETTINGS = {
  concurrency: 2,
  webpEngine: "auto" as const,
  jpegMatteColor: "#FFFFFF",
  filenameSuffix: "",
  warnOnLeave: true,
};
