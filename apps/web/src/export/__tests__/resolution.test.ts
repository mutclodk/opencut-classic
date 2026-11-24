import { describe, expect, test } from "bun:test";
import { resolveExportSize } from "@/export";

describe("resolveExportSize", () => {
	test("source keeps the project canvas size", () => {
		expect(
			resolveExportSize({
				canvasSize: { width: 1080, height: 1920 },
				resolution: "source",
			}),
		).toEqual({ width: 1080, height: 1920 });
	});

	test("undefined resolution keeps the project canvas size", () => {
		expect(
			resolveExportSize({ canvasSize: { width: 1920, height: 1080 } }),
		).toEqual({ width: 1920, height: 1080 });
	});

	test("720p scales a vertical canvas by its shorter side", () => {
		expect(
			resolveExportSize({
				canvasSize: { width: 1080, height: 1920 },
				resolution: "720p",
			}),
		).toEqual({ width: 720, height: 1280 });
	});

	test("720p scales a landscape canvas by its shorter side", () => {
		expect(
			resolveExportSize({
				canvasSize: { width: 1920, height: 1080 },
				resolution: "720p",
			}),
		).toEqual({ width: 1280, height: 720 });
	});

	test("never upscales a canvas smaller than the target", () => {
		expect(
			resolveExportSize({
				canvasSize: { width: 640, height: 360 },
				resolution: "1080p",
			}),
		).toEqual({ width: 640, height: 360 });
	});

	test("rounds dimensions to even numbers for the encoders", () => {
		const size = resolveExportSize({
			canvasSize: { width: 1080, height: 1919 },
			resolution: "480p",
		});
		expect(size.width % 2).toBe(0);
		expect(size.height % 2).toBe(0);
		expect(size.width).toBe(480);
	});
});
