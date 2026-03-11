// ---------------------------------------------------------------------------
// Image Processing Utilities
// Pure client-side image manipulation via Canvas API. Zero server dependencies.
// ---------------------------------------------------------------------------

// ---- Type Definitions -----------------------------------------------------

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorAdjustments {
  /** 0-2, default 1 */
  brightness: number;
  /** 0-2, default 1 */
  contrast: number;
  /** 0-2, default 1 */
  saturation: number;
  /** -100 to 100, default 0 */
  temperature: number;
}

// ---- Constants ------------------------------------------------------------

export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
};

export const COLOR_PRESETS: Record<
  string,
  { label: string; adjustments: ColorAdjustments }
> = {
  original: { label: "原图", adjustments: DEFAULT_COLOR_ADJUSTMENTS },
  bright: {
    label: "明亮",
    adjustments: {
      brightness: 1.2,
      contrast: 1.05,
      saturation: 1.1,
      temperature: 0,
    },
  },
  warm: {
    label: "暖色",
    adjustments: {
      brightness: 1.05,
      contrast: 1,
      saturation: 1.1,
      temperature: 30,
    },
  },
  cool: {
    label: "冷色",
    adjustments: {
      brightness: 1,
      contrast: 1.05,
      saturation: 0.9,
      temperature: -30,
    },
  },
};

// ---- Internal Helpers (not exported) --------------------------------------

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob returned null"));
        }
      },
      type,
      quality,
    );
  });
}

// ---- Exported Utilities ---------------------------------------------------

/**
 * Load an image from the given `src` URL.
 * Sets `crossOrigin = "anonymous"` to allow canvas operations on cross-origin
 * images served with the appropriate CORS headers.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = (_event) =>
      reject(new Error(`Failed to load image: ${src}`));

    img.src = src;
  });
}

/**
 * Get the natural (original) dimensions of an image.
 */
export async function getImageDimensions(
  src: string,
): Promise<ImageDimensions> {
  const img = await loadImage(src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Resize an image so that its longest edge does not exceed `maxDimension`,
 * while preserving the original aspect ratio.
 */
export async function resizeImage(
  src: string,
  maxDimension: number,
  format: string = "image/webp",
  quality: number = 0.95,
): Promise<Blob> {
  const img = await loadImage(src);
  const { naturalWidth, naturalHeight } = img;

  const scale = Math.min(
    maxDimension / Math.max(naturalWidth, naturalHeight),
    1,
  );
  const width = Math.round(naturalWidth * scale);
  const height = Math.round(naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  ctx.drawImage(img, 0, 0, width, height);

  return canvasToBlob(canvas, format, quality);
}

/**
 * Convert an image to WebP format.
 */
export async function convertToWebP(
  src: string,
  quality: number = 0.95,
): Promise<Blob> {
  const img = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, "image/webp", quality);
}

/**
 * Crop a rectangular area from an image.
 */
export async function cropImage(
  src: string,
  crop: CropArea,
  format: string = "image/webp",
  quality: number = 0.95,
): Promise<Blob> {
  const img = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return canvasToBlob(canvas, format, quality);
}

/**
 * Build a CSS `filter` string from the given colour adjustments.
 *
 * This is a **synchronous** helper designed for real-time preview — apply it
 * as the `style.filter` of an `<img>` element to avoid a full canvas render
 * on every slider change.
 *
 * Temperature simulation:
 *   - temperature > 0  -> sepia(<amount>) hue-rotate(-10deg)   (warm)
 *   - temperature < 0  -> sepia(<amount>) hue-rotate(180deg)   (cool)
 *   - sepia amount = abs(temperature) / 200
 */
export function buildCSSFilter(adjustments: ColorAdjustments): string {
  const parts: string[] = [
    `brightness(${adjustments.brightness})`,
    `contrast(${adjustments.contrast})`,
    `saturate(${adjustments.saturation})`,
  ];

  if (adjustments.temperature !== 0) {
    const sepiaAmount = Math.abs(adjustments.temperature) / 200;
    const hueRotate = adjustments.temperature > 0 ? -10 : 180;
    parts.push(`sepia(${sepiaAmount})`);
    parts.push(`hue-rotate(${hueRotate}deg)`);
  }

  return parts.join(" ");
}

/**
 * Apply colour / tone adjustments to an image using canvas filters and return
 * the result as a Blob.
 *
 * Temperature is simulated with a sepia + hue-rotate combination (see
 * `buildCSSFilter` for details).
 */
export async function applyColorAdjustments(
  src: string,
  adjustments: ColorAdjustments,
  format: string = "image/webp",
  quality: number = 0.95,
): Promise<Blob> {
  const img = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  ctx.filter = buildCSSFilter(adjustments);
  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, format, quality);
}

/**
 * Rotate an image by 90, 180 or 270 degrees (clockwise).
 */
export async function rotateImage(
  src: string,
  degrees: 90 | 180 | 270,
  format: string = "image/webp",
  quality: number = 0.95,
): Promise<Blob> {
  const img = await loadImage(src);
  const { naturalWidth: w, naturalHeight: h } = img;

  const canvas = document.createElement("canvas");

  // For 90 / 270 degrees the output dimensions are swapped.
  if (degrees === 90 || degrees === 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2);

  return canvasToBlob(canvas, format, quality);
}

/**
 * Format a byte count into a human-readable string (B / KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convert a `Blob` to a `data:` URL string.
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
    reader.readAsDataURL(blob);
  });
}
