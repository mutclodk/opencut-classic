"use client";

import type { ReactNode } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
} from "@/components/section";
import { cn } from "@/utils/ui";
import { resolveAnimationPathValueAtTime } from "@/animation";
import { useElementPlayhead } from "../hooks/use-element-playhead";
import { useKeyframedParamProperty } from "../hooks/use-keyframed-param-property";
import {
	getElementParams,
	readElementParamValue,
	writeElementParamValue,
	type ElementParamDefinition,
} from "@/params/registry";
import type { TextElement } from "@/timeline";
import type { MediaTime } from "@/wasm";

/**
 * Bold / Italic / Underline toggle buttons for text elements.
 *
 * These write the same `fontWeight`, `fontStyle` and `textDecoration`
 * element params as the generic param fields, through the same
 * preview/commit path, so the values flow into text measurement and the
 * canvas font string used by both the preview renderer and the exporter.
 */
export function TextStyleToggles({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
		startTime: element.startTime,
		duration: element.duration,
	});
	const params = getElementParams({ element });
	const findParam = (key: string) => params.find((param) => param.key === key);

	const fontWeightParam = findParam("fontWeight");
	const fontStyleParam = findParam("fontStyle");
	const textDecorationParam = findParam("textDecoration");

	if (!fontWeightParam && !fontStyleParam && !textDecorationParam) {
		return null;
	}

	return (
		<Section sectionKey={`${element.id}:text-style`}>
			<SectionContent className="pt-4">
				<SectionFields>
					<SectionField label="Style">
						<div className="flex gap-1">
							{fontWeightParam && (
								<StyleToggle
									element={element}
									trackId={trackId}
									param={fontWeightParam}
									localTime={localTime}
									isPlayheadWithinElementRange={isPlayheadWithinElementRange}
									activeValue="bold"
									inactiveValue="normal"
									label="Bold"
								>
									<Bold className="size-4" />
								</StyleToggle>
							)}
							{fontStyleParam && (
								<StyleToggle
									element={element}
									trackId={trackId}
									param={fontStyleParam}
									localTime={localTime}
									isPlayheadWithinElementRange={isPlayheadWithinElementRange}
									activeValue="italic"
									inactiveValue="normal"
									label="Italic"
								>
									<Italic className="size-4" />
								</StyleToggle>
							)}
							{textDecorationParam && (
								<StyleToggle
									element={element}
									trackId={trackId}
									param={textDecorationParam}
									localTime={localTime}
									isPlayheadWithinElementRange={isPlayheadWithinElementRange}
									activeValue="underline"
									inactiveValue="none"
									label="Underline"
								>
									<Underline className="size-4" />
								</StyleToggle>
							)}
						</div>
					</SectionField>
				</SectionFields>
			</SectionContent>
		</Section>
	);
}

function StyleToggle({
	element,
	trackId,
	param,
	localTime,
	isPlayheadWithinElementRange,
	activeValue,
	inactiveValue,
	label,
	children,
}: {
	element: TextElement;
	trackId: string;
	param: ElementParamDefinition;
	localTime: MediaTime;
	isPlayheadWithinElementRange: boolean;
	activeValue: string;
	inactiveValue: string;
	label: string;
	children: ReactNode;
}) {
	const baseValue = readElementParamValue({ element, param }) ?? param.default;
	const resolvedValue = resolveAnimationPathValueAtTime({
		animations: element.animations,
		propertyPath: param.key,
		localTime,
		fallbackValue: baseValue,
	});
	const animatedParam = useKeyframedParamProperty({
		param,
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: param.key,
		localTime,
		isPlayheadWithinElementRange,
		resolvedValue,
		buildBaseUpdates: ({ value }) =>
			writeElementParamValue({ element, param, value }),
	});

	const isActive = resolvedValue === activeValue;

	return (
		<button
			type="button"
			aria-pressed={isActive}
			aria-label={label}
			title={label}
			className={cn(
				"flex size-8 items-center justify-center rounded-md border transition-colors",
				isActive
					? "border-primary bg-primary text-primary-foreground"
					: "hover:bg-accent bg-transparent",
			)}
			onClick={() => {
				animatedParam.onPreview(isActive ? inactiveValue : activeValue);
				animatedParam.onCommit();
			}}
		>
			{children}
		</button>
	);
}
