import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import { DEFAULTS } from "@/timeline/defaults";
import { buildTextElement } from "@/timeline/element-utils";
import { resolveDefaultTextFontSize } from "@/text/typography";
import type { MediaTime } from "@/wasm";

export function TextView() {
	const editor = useEditor();

	const handleAddToTimeline = ({ currentTime }: { currentTime: MediaTime }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const canvasSize = editor.project.getActiveOrNull()?.settings.canvasSize;
		const fontSize = canvasSize
			? resolveDefaultTextFontSize({
					canvasSize,
					content: String(DEFAULTS.text.element.params.content),
				})
			: DEFAULTS.text.element.params.fontSize;

		const element = buildTextElement({
			raw: {
				...DEFAULTS.text.element,
				params: {
					...DEFAULTS.text.element.params,
					fontSize,
				},
			},
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<PanelView title="Text">
			<DraggableItem
				name="Default text"
				preview={
					<div className="bg-accent flex size-full items-center justify-center rounded">
						<span className="text-xs select-none">Default text</span>
					</div>
				}
				dragData={{
					id: "temp-text-id",
					type: DEFAULTS.text.element.type,
					name: DEFAULTS.text.element.name,
					content: "Default text",
				}}
				aspectRatio={1}
				onAddToTimeline={handleAddToTimeline}
				shouldShowLabel={false}
			/>
		</PanelView>
	);
}
