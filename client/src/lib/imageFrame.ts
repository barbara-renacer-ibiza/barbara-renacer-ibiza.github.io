import type { CSSProperties } from "react";

export type ImageFrame = {
  x: number;
  y: number;
  scale: number;
};

export const defaultImageFrame: ImageFrame = { x: 50, y: 50, scale: 1 };

export function parseImageFrame(value: string | null | undefined): ImageFrame {
  if (!value) return defaultImageFrame;
  const match = value.match(/#frame=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/);
  if (!match) return defaultImageFrame;
  const x = Math.min(100, Math.max(0, Number(match[1])));
  const y = Math.min(100, Math.max(0, Number(match[2])));
  const scale = Math.min(2.5, Math.max(1, Number(match[3])));
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(scale) ? { x, y, scale } : defaultImageFrame;
}

export function withImageFrame(value: string, frame: ImageFrame) {
  if (!value) return value;
  const cleanUrl = value.replace(/#frame=\d+(?:\.\d+)?,\d+(?:\.\d+)?,\d+(?:\.\d+)?$/, "");
  const normalized = {
    x: Math.min(100, Math.max(0, Math.round(frame.x * 10) / 10)),
    y: Math.min(100, Math.max(0, Math.round(frame.y * 10) / 10)),
    scale: Math.min(2.5, Math.max(1, Math.round(frame.scale * 100) / 100)),
  };
  const isDefault = normalized.x === 50 && normalized.y === 50 && normalized.scale === 1;
  return isDefault ? cleanUrl : `${cleanUrl}#frame=${normalized.x},${normalized.y},${normalized.scale}`;
}

export function imageFrameStyle(value: string | null | undefined): CSSProperties {
  const frame = parseImageFrame(value);
  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${frame.scale})`,
    transformOrigin: `${frame.x}% ${frame.y}%`,
  };
}
