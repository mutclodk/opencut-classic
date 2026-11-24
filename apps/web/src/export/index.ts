import type { FrameRate } from "opencut-wasm";
import { EXPORT_MIME_TYPES } from "./mime-types";

export const EXPORT_QUALITY_VALUES = [
	"low",
	"medium",
	"high",
	"very_high",
] as const;

export const EXPORT_FORMAT_VALUES = ["mp4", "webm"] as const;

export const EXPORT_RESOLUTION_VALUES = [
	"source",
	"1080p",
	"720p",
	"480p",
] as const;

export type ExportFormat = (typeof EXPORT_FORMAT_VALUES)[number];
export type ExportQuality = (typeof EXPORT_QUALITY_VALUES)[number];
export type ExportResolution = (typeof EXPORT_RESOLUTION_VALUES)[number];

export interface ExportOptions {
	format: ExportFormat;
	quality: ExportQuality;
	fps?: FrameRate;
	includeAudio?: boolean;
	resolution?: ExportResolution;
}

const EXPORT_RESOLUTION_SHORT_SIDE: Record<
	Exclude<ExportResolution, "source">,
	number
> = {
	"1080p": 1080,
	"720p": 720,
	"480p": 480,
};

/**
 * Resolves the pixel size an export should be rendered at.
 *
 * "source" keeps the project canvas size untouched. The named resolutions
 * scale the canvas so its shorter side matches the target (e.g. a 1080x1920
 * vertical project exported at "720p" becomes 720x1280), preserving the
 * project aspect ratio exactly. Exports are never upscaled, and dimensions
 * are rounded to even numbers because H.264/VP9 require them.
 */
export function resolveExportSize({
	canvasSize,
	resolution,
}: {
	canvasSize: { width: number; height: number };
	resolution?: ExportResolution;
}): { width: number; height: number } {
	if (!resolution || resolution === "source") {
		return { width: canvasSize.width, height: canvasSize.height };
	}

	const targetShortSide = EXPORT_RESOLUTION_SHORT_SIDE[resolution];
	const sourceShortSide = Math.min(canvasSize.width, canvasSize.height);
	if (sourceShortSide <= targetShortSide) {
		return { width: canvasSize.width, height: canvasSize.height };
	}

	const scale = targetShortSide / sourceShortSide;
	const toEven = (value: number) => Math.max(2, Math.round(value / 2) * 2);
	return {
		width: toEven(canvasSize.width * scale),
		height: toEven(canvasSize.height * scale),
	};
}

export interface ExportResult {
	success: boolean;
	buffer?: ArrayBuffer;
	error?: string;
	cancelled?: boolean;
}

export interface ExportState {
	isExporting: boolean;
	progress: number;
	result: ExportResult | null;
}

export function getExportMimeType({
	format,
}: {
	format: ExportFormat;
}): string {
	return EXPORT_MIME_TYPES[format];
}

export function getExportFileExtension({
	format,
}: {
	format: ExportFormat;
}): string {
	return `.${format}`;
}

export function downloadBuffer({
	buffer,
	filename,
	mimeType,
}: {
	buffer: ArrayBuffer;
	filename: string;
	mimeType: string;
}): void {
	const blob = new Blob([buffer], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const downloadLink = document.createElement("a");
	downloadLink.href = url;
	downloadLink.download = filename;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
	URL.revokeObjectURL(url);
}
