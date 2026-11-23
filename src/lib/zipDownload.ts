import JSZip from "jszip";
import { ImageItem } from "@/types/image";
import { deduplicateFilename } from "@/lib/format";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

export async function downloadBatchAsZip(
  items: ImageItem[],
  onProgress?: (percent: number) => void
): Promise<number> {
  const readyItems = items.filter(
    (item): item is ImageItem & { result: NonNullable<ImageItem["result"]> } =>
      item.status === "done" && Boolean(item.result)
  );

  if (readyItems.length === 0) {
    return 0;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const item of readyItems) {
    const safeName = deduplicateFilename(item.result.outputFilename, usedNames);
    zip.file(safeName, item.result.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "STORE", // Images are already compressed; STORE is fast and avoids wasting CPU
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(zipBlob, `zektex-image-studio-${dateStamp}.zip`);
  return readyItems.length;
}
