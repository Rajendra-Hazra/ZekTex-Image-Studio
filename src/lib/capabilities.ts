import { BrowserCapabilities } from "@/types/image";

let cachedCapabilities: BrowserCapabilities | null = null;

function testCanvasWebP(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const dataUrl = canvas.toDataURL("image/webp");
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl.startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function testAvifDecode(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    // Minimal 1x1 AVIF payload
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAABAA0ABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
  });
}

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const [avifDecode] = await Promise.all([testAvifDecode()]);

  cachedCapabilities = {
    canvasWebP: testCanvasWebP(),
    avifDecode,
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    webWorker: typeof Worker !== "undefined",
    webAssembly: typeof WebAssembly !== "undefined",
  };

  return cachedCapabilities;
}
