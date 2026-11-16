const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 12 * 1024 * 1024;

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type ProductImageType = keyof typeof extensions;

export class ProductImageUploadError extends Error {
  constructor(readonly status: 400 | 413, message: string) {
    super(message);
    this.name = "ProductImageUploadError";
  }
}

function hasValidSignature(contentType: ProductImageType, bytes: Buffer) {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

export function decodeProductImageDataUrl(value: unknown) {
  if (typeof value !== "string") throw new ProductImageUploadError(400, "Formato immagine non supportato.");
  if (value.length > MAX_DATA_URL_LENGTH) throw new ProductImageUploadError(413, "Immagine troppo grande. Il limite è 8 MB.");

  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new ProductImageUploadError(400, "Formato immagine non supportato.");

  const contentType = match[1] as ProductImageType;
  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");
  if (bytes.toString("base64") !== base64) throw new ProductImageUploadError(400, "Formato immagine non supportato.");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ProductImageUploadError(413, "Immagine troppo grande. Il limite è 8 MB.");
  if (!hasValidSignature(contentType, bytes)) throw new ProductImageUploadError(400, "Il contenuto del file non corrisponde al formato immagine.");

  return { bytes, contentType, extension: extensions[contentType] };
}
