import type { CSSProperties } from "react";

export type ImageFrame = {
  x: number;
  y: number;
  scale: number;
  fit: "fill" | "cover" | "contain";
};

export const defaultImageFrame: ImageFrame = { x: 50, y: 50, scale: 1, fit: "contain" };
const MIN_IMAGE_SCALE = 0.5;
const MAX_IMAGE_SCALE = 4;
const FRAME_PATTERN = /#frame=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(fill|cover|contain))?/;

function normalizedFit(value: string | undefined): ImageFrame["fit"] {
  // Older links used "fill" (or omitted the mode) and stretched the image.
  // Read those links as "contain" so existing photos keep their proportions.
  return value === "cover" ? "cover" : "contain";
}

export function parseImageFrame(value: string | null | undefined): ImageFrame {
  if (!value) return defaultImageFrame;
  const match = value.match(FRAME_PATTERN);
  if (!match) return defaultImageFrame;
  const x = Math.min(100, Math.max(0, Number(match[1])));
  const y = Math.min(100, Math.max(0, Number(match[2])));
  const scale = Math.min(MAX_IMAGE_SCALE, Math.max(MIN_IMAGE_SCALE, Number(match[3])));
  const fit = normalizedFit(match[4]);
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(scale)
    ? { x, y, scale, fit }
    : defaultImageFrame;
}

export function moveImageFrame(
  frame: ImageFrame,
  deltaX: number,
  deltaY: number,
  width: number,
  height: number
): ImageFrame {
  if (width <= 0 || height <= 0) return frame;
  return {
    ...frame,
    x: Math.min(100, Math.max(0, frame.x - (deltaX / width) * 100 / frame.scale)),
    y: Math.min(100, Math.max(0, frame.y - (deltaY / height) * 100 / frame.scale)),
  };
}

export function withImageFrame(value: string, frame: ImageFrame) {
  if (!value) return value;
  const cleanUrl = value.replace(/#frame=\d+(?:\.\d+)?,\d+(?:\.\d+)?,\d+(?:\.\d+)?(?:,(?:fill|cover|contain))?$/, "");
  const normalized = {
    x: Math.min(100, Math.max(0, Math.round(frame.x * 10) / 10)),
    y: Math.min(100, Math.max(0, Math.round(frame.y * 10) / 10)),
    scale: Math.min(MAX_IMAGE_SCALE, Math.max(MIN_IMAGE_SCALE, Math.round(frame.scale * 100) / 100)),
    fit: normalizedFit(frame.fit),
  };
  const isDefault = normalized.x === 50 && normalized.y === 50 && normalized.scale === 1 && normalized.fit === "contain";
  return isDefault ? cleanUrl : `${cleanUrl}#frame=${normalized.x},${normalized.y},${normalized.scale}${normalized.fit === "contain" ? "" : `,${normalized.fit}`}`;
}

export function fitImageFrame(value: string, fit: ImageFrame["fit"]) {
  return withImageFrame(value, { ...defaultImageFrame, fit });
}

export function imageFrameStyle(value: string | null | undefined): CSSProperties {
  const frame = parseImageFrame(value);
  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    objectFit: frame.fit,
    transform: `scale(${frame.scale})`,
    transformOrigin: `${frame.x}% ${frame.y}%`,
  };
}
