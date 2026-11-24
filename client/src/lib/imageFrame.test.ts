import { describe, expect, it } from "vitest";
import { defaultImageFrame, fitImageFrame, moveImageFrame, parseImageFrame, withImageFrame } from "./imageFrame";

describe("image frame editor", () => {
  it("pans opposite the pointer delta so the photo follows the drag", () => {
    expect(moveImageFrame(defaultImageFrame, 25, -25, 100, 100)).toEqual({
      x: 25,
      y: 75,
      scale: 1,
      fit: "fill",
    });
  });

  it("keeps panning within the image bounds and accounts for zoom", () => {
    expect(moveImageFrame({ ...defaultImageFrame, scale: 2 }, -100, 100, 100, 100)).toEqual({
      x: 100,
      y: 0,
      scale: 2,
      fit: "fill",
    });
  });

  it("does not change the frame when the preview has no usable size", () => {
    expect(moveImageFrame(defaultImageFrame, 10, 10, 0, 0)).toBe(defaultImageFrame);
  });

  it("supports the expanded zoom limit in saved and parsed frame URLs", () => {
    const url = withImageFrame("https://example.test/oil.jpg", {
      ...defaultImageFrame,
      scale: 5,
    });
    expect(url).toBe("https://example.test/oil.jpg#frame=50,50,4");
    expect(parseImageFrame(url).scale).toBe(4);
  });

  it("auto-fills or shows the whole photo in one click while centering it", () => {
    const source = "https://example.test/oil.jpg#frame=18,73,2.25,contain";
    expect(fitImageFrame(source, "fill")).toBe("https://example.test/oil.jpg");
    expect(fitImageFrame(source, "cover")).toBe("https://example.test/oil.jpg#frame=50,50,1,cover");
    expect(fitImageFrame(source, "contain")).toBe("https://example.test/oil.jpg#frame=50,50,1,contain");
  });

  it("uses full-frame fill for images without saved framing and preserves explicit modes", () => {
    expect(defaultImageFrame.fit).toBe("fill");
    expect(parseImageFrame("https://example.test/new-upload.jpg").fit).toBe("fill");
    expect(parseImageFrame("https://example.test/existing-oil.jpg#frame=50,36,1").fit).toBe("fill");
    expect(parseImageFrame("https://example.test/oil.jpg#frame=50,36,1,cover").fit).toBe("cover");
    expect(parseImageFrame("https://example.test/oil.jpg#frame=50,36,1,contain").fit).toBe("contain");
  });
});
