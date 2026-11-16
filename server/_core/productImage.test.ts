import { describe, expect, it } from "vitest";
import { decodeProductImageDataUrl, ProductImageUploadError } from "./productImage";

function dataUrl(contentType: string, bytes: Buffer) {
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

describe("product image upload validation", () => {
  it.each([
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x01]), "jpg"],
    ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "png"],
    ["image/webp", Buffer.from("RIFF0000WEBP", "ascii"), "webp"],
  ])("accepts a valid %s signature", (contentType, bytes, extension) => {
    const result = decodeProductImageDataUrl(dataUrl(contentType, bytes));
    expect(result).toMatchObject({ contentType, extension });
    expect(result.bytes).toEqual(bytes);
  });

  it("rejects unsupported formats such as SVG", () => {
    expect(() => decodeProductImageDataUrl("data:image/svg+xml;base64,PHN2Zz4="))
      .toThrow("Formato immagine non supportato.");
  });

  it("rejects a content type that does not match the file signature", () => {
    const error = (() => {
      try {
        decodeProductImageDataUrl(dataUrl("image/png", Buffer.from("not a png")));
      } catch (caught) {
        return caught;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(ProductImageUploadError);
    expect(error).toMatchObject({ status: 400 });
  });

  it("rejects images larger than eight megabytes", () => {
    const bytes = Buffer.alloc(8 * 1024 * 1024 + 1);
    bytes.set([0xff, 0xd8, 0xff]);
    const error = (() => {
      try {
        decodeProductImageDataUrl(dataUrl("image/jpeg", bytes));
      } catch (caught) {
        return caught;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(ProductImageUploadError);
    expect(error).toMatchObject({ status: 413 });
  });
});
