import { clamp } from "@/utils/math";

export const MIN_FONT_SIZE = 5;
export const MAX_FONT_SIZE = 300;
export const DEFAULT_TEXT_COLOR = "#000000";

/** Font size assigned to text elements before any canvas-aware adjustment. */
export const DEFAULT_FONT_SIZE = 15;

/**
 * higher value: smaller font size
 * lower value: larger font size
 */
export const FONT_SIZE_SCALE_REFERENCE = 90;

/** Rough average glyph advance as a fraction of the font size (Arial-like). */
const AVERAGE_GLYPH_WIDTH_RATIO = 0.55;

/** Fraction of the canvas width a new text element's longest line may occupy. */
const DEFAULT_TEXT_WIDTH_FRACTION = 0.9;

/**
 * Picks the starting font size for a newly created text element so that its
 * longest line fits inside the canvas instead of overflowing it.
 *
 * The rendered font size in pixels is
 * `fontSize * canvasHeight / FONT_SIZE_SCALE_REFERENCE`, so on tall, narrow
 * canvases (e.g. 9:16) the historical default of 15 renders hundreds of
 * pixels tall and a short line of text spills past both edges. The returned
 * size never exceeds the historical default and never drops below
 * MIN_FONT_SIZE, so wide canvases keep the previous behaviour.
 */
export function resolveDefaultTextFontSize({
	canvasSize,
	content,
}: {
	canvasSize: { width: number; height: number };
	content: string;
}): number {
	const longestLineLength = content
		.split("\n")
		.reduce((max, line) => Math.max(max, line.length), 0);
	if (longestLineLength === 0 || canvasSize.height <= 0) {
		return DEFAULT_FONT_SIZE;
	}

	const fittingSize =
		(DEFAULT_TEXT_WIDTH_FRACTION *
			canvasSize.width *
			FONT_SIZE_SCALE_REFERENCE) /
		(AVERAGE_GLYPH_WIDTH_RATIO * canvasSize.height * longestLineLength);

	return clamp({
		value: Math.floor(fittingSize),
		min: MIN_FONT_SIZE,
		max: DEFAULT_FONT_SIZE,
	});
}
