import { describe, expect, test } from "bun:test";
import {
	DEFAULT_FONT_SIZE,
	FONT_SIZE_SCALE_REFERENCE,
	MIN_FONT_SIZE,
	resolveDefaultTextFontSize,
} from "@/text/typography";

describe("resolveDefaultTextFontSize", () => {
	test("keeps the historical default on a wide canvas", () => {
		expect(
			resolveDefaultTextFontSize({
				canvasSize: { width: 1920, height: 1080 },
				content: "Default text",
			}),
		).toBe(DEFAULT_FONT_SIZE);
	});

	test("shrinks the default on a 9:16 canvas so the line fits", () => {
		const fontSize = resolveDefaultTextFontSize({
			canvasSize: { width: 1080, height: 1920 },
			content: "Default text",
		});
		expect(fontSize).toBeLessThan(DEFAULT_FONT_SIZE);
		expect(fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE);

		// The rendered line must fit within the canvas width, using the same
		// average glyph width estimate as the implementation.
		const renderedFontPx = fontSize * (1920 / FONT_SIZE_SCALE_REFERENCE);
		const estimatedLineWidth = 0.55 * renderedFontPx * "Default text".length;
		expect(estimatedLineWidth).toBeLessThanOrEqual(1080);
	});

	test("uses the longest line for multi-line content", () => {
		const single = resolveDefaultTextFontSize({
			canvasSize: { width: 1080, height: 1920 },
			content: "Hi",
		});
		const multi = resolveDefaultTextFontSize({
			canvasSize: { width: 1080, height: 1920 },
			content: "Hi\nA much longer second line",
		});
		expect(multi).toBeLessThan(single);
	});

	test("falls back to the default for empty content", () => {
		expect(
			resolveDefaultTextFontSize({
				canvasSize: { width: 1080, height: 1920 },
				content: "",
			}),
		).toBe(DEFAULT_FONT_SIZE);
	});
});
