/**
 * Image Utilities for Visual Context Capture.
 */

/**
 * Convert a Base64 PNG Data URL to a Blob for uploading or storage.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Extract image dimensions (width & height) from a PNG Data URL in browser context.
 */
export async function getDataUrlDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // Basic fallback dimensions if Image decoding is unavailable
    const defaultDims = { width: 1280, height: 720 };
    if (typeof Image === 'undefined') {
      resolve(defaultDims);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(defaultDims);
    };
    img.src = dataUrl;
  });
}

/**
 * Format a human-readable size string from byte count.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
