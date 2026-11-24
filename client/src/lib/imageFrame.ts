import type { CSSProperties } from "react";

export type ImageFrame = {
  x: number;
  y: number;
  scale: number;
  fit: "cover" | "contain";
};

export const defaultImageFrame: ImageFrame = { x: 50, y: 50, scale: 1, fit: "cover" };
const MAX_IMAGE_SCALE = 4;

export function parseImageFrame(value: string | null | undefined): ImageFrame {
  if (!value) return defaultImageFrame;
  const match = value.match(/#frame=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(cover|contain))?/);
  if (!match) return defaultImageFrame;
  const x = Math.min(100, Math.max(0, Number(match[1])));
  const y = Math.min(100, Math.max(0, Number(match[2])));
  const scale = Math.min(MAX_IMAGE_SCALE, Math.max(1, Number(match[3])));
  const fit = match[4] === "contain" ? "contain" : "cover";
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(scale) ? { x, y, scale, fit } : defaultImageFrame;
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
  const cleanUrl = value.replace(/#frame=\d+(?:\.\d+)?,\d+(?:\.\d+)?,\d+(?:\.\d+)?(?:,(?:cover|contain))?$/, "");
  const normalized = {
    x: Math.min(100, Math.max(0, Math.round(frame.x * 10) / 10)),
    y: Math.min(100, Math.max(0, Math.round(frame.y * 10) / 10)),
    scale: Math.min(MAX_IMAGE_SCALE, Math.max(1, Math.round(frame.scale * 100) / 100)),
    fit: frame.fit === "contain" ? "contain" : "cover",
  };
  const isDefault = normalized.x === 50 && normalized.y === 50 && normalized.scale === 1 && normalized.fit === "cover";
  return isDefault ? cleanUrl : `${cleanUrl}#frame=${normalized.x},${normalized.y},${normalized.scale}${normalized.fit === "contain" ? `,${normalized.fit}` : ""}`;
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
