import { describe, expect, it } from "vitest";
import { defaultImageFrame, fitImageFrame, imageFrameStyle, moveImageFrame, parseImageFrame, withImageFrame } from "./imageFrame";

describe("image frame editor", () => {
  it("pans opposite the pointer delta so the photo follows the drag", () => {
    expect(moveImageFrame(defaultImageFrame, 25, -25, 100, 100)).toEqual({
      x: 25,
      y: 75,
      scale: 1,
      fit: "contain",
    });
  });

  it("keeps panning within the image bounds and accounts for zoom", () => {
    expect(moveImageFrame({ ...defaultImageFrame, scale: 2 }, -100, 100, 100, 100)).toEqual({
      x: 100,
      y: 0,
      scale: 2,
      fit: "contain",
    });
  });

  it("does not change the frame when the preview has no usable size", () => {
    expect(moveImageFrame(defaultImageFrame, 10, 10, 0, 0)).toBe(defaultImageFrame);
  });

  it("supports zooming out below 100% and clamps it to 50%", () => {
    const url = withImageFrame("https://example.test/oil.jpg", {
      ...defaultImageFrame,
      scale: 0.35,
    });
    expect(url).toBe("https://example.test/oil.jpg#frame=50,50,0.5");
    expect(parseImageFrame(url).scale).toBe(0.5);
  });

  it("keeps the expanded zoom limit in saved and parsed frame URLs", () => {
    const url = withImageFrame("https://example.test/oil.jpg", {
      ...defaultImageFrame,
      scale: 5,
    });
    expect(url).toBe("https://example.test/oil.jpg#frame=50,50,4");
    expect(parseImageFrame(url).scale).toBe(4);
  });

  it("selects full-photo or optional crop mode in one click while centering", () => {
    const source = "https://example.test/oil.jpg#frame=18,73,2.25,cover";
    expect(fitImageFrame(source, "contain")).toBe("https://example.test/oil.jpg");
    expect(fitImageFrame(source, "cover")).toBe("https://example.test/oil.jpg#frame=50,50,1,cover");
  });

  it("defaults to the full photo without distortion and reads older frame URLs safely", () => {
    expect(defaultImageFrame.fit).toBe("contain");
    expect(parseImageFrame("https://example.test/new-upload.jpg").fit).toBe("contain");
    expect(parseImageFrame("https://example.test/old.jpg#frame=50,36,1").fit).toBe("contain");
    expect(parseImageFrame("https://example.test/old-fill.jpg#frame=50,36,1,fill").fit).toBe("contain");
    expect(parseImageFrame("https://example.test/cropped.jpg#frame=50,36,1,cover").fit).toBe("cover");
    expect(parseImageFrame("https://example.test/full.jpg#frame=50,36,1,contain").fit).toBe("contain");
    expect(imageFrameStyle("https://example.test/new-upload.jpg").objectFit).toBe("contain");
  });
});
