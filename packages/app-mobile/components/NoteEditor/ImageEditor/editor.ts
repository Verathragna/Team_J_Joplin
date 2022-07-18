
import EditorImage from './EditorImage';
import { Vec2, Vec3 } from './math';
import CanvasRenderer from './rendering/CanvasRenderer';
import ToolController from './tools/ToolController';
import { Pointer, PointerDevice, InputEvtType, PointerEvt, EditorEventType, EditorEventDataType } from './types';
import Command from "./commands/Command";
import UndoRedoHistory from './UndoRedoHistory';
import Viewport from './Viewport';
import Notifier from '@joplin/lib/Notifier';

export class ImageEditor {
	// Wrapper around the viewport and toolbar
	private container: HTMLElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private canvasRenderer: CanvasRenderer;

	private history: UndoRedoHistory;
	public image: EditorImage;

	// private toolbar: EditorToolbar;
	public viewport: Viewport;
	public toolController: ToolController;
	public notifier: Notifier<EditorEventType, EditorEventDataType>;

	public constructor(parent: HTMLElement) {
		this.viewport = new Viewport();
		this.image = new EditorImage();
		this.history = new UndoRedoHistory(this);
		this.toolController = new ToolController(this);
		this.notifier = new Notifier();

		this.container = document.createElement('div');
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvasRenderer = new CanvasRenderer(this.ctx, this.viewport);

		this.canvas.className = 'ink';

		this.container.replaceChildren(this.canvas);
		parent.appendChild(this.container);
		this.viewport.updateScreenSize(Vec2.of(this.canvas.width, this.canvas.height));

		this.registerListeners();
		this.rerender();
	}

	private registerListeners() {
		const pointerTypeToDevice: Record<string, PointerDevice> = {
			'mouse': PointerDevice.Mouse,
			'pen': PointerDevice.Pen,
			'touch': PointerDevice.Touch,
		};

		const pointerFor = (evt: PointerEvent, isDown: boolean): Pointer => {
			const screenPos = Vec2.of(evt.clientX, evt.clientY);
			const device = pointerTypeToDevice[evt.pointerType] ?? PointerDevice.Other;

			return {
				timeStamp: evt.timeStamp,
				isPrimary: evt.isPrimary,
				down: isDown,
				id: evt.pointerId,
				screenPos,
				device,
				canvasPos: this.viewport.screenToCanvas(screenPos),
			};
		};

		const pointers: Record<number, Pointer> = {};
		const getPointerList = () => {
			const res = [];
			for (const id in pointers) {
				if (pointers[id]) {
					res.push(pointers[id]);
				}
			}
			return res;
		};

		this.container.addEventListener('pointerdown', evt => {
			const pointer = pointerFor(evt, true);
			pointers[pointer.id] = pointer;

			this.container.setPointerCapture(pointer.id);
			const event: PointerEvt = {
				kind: InputEvtType.PointerDownEvt,
				current: pointer,
				allPointers: getPointerList(),
			};
			if (this.toolController.dispatchEvent(event)) {
				//evt.preventDefault();
			}

			return true;
		});

		this.container.addEventListener('pointermove', evt => {
			const pointer = pointerFor(evt, pointers[evt.pointerId]?.down ?? false);
			if (pointer.down) {
				pointers[pointer.id] = pointer;

				if (this.toolController.dispatchEvent({
					kind: InputEvtType.PointerMoveEvt,
					current: pointer,
					allPointers: getPointerList(),
				})) {
					evt.preventDefault();
				}
			}
		});

		this.container.addEventListener('pointerup', evt => {
			const pointer = pointerFor(evt, false);
			if (!pointers[pointer.id]) {
				return;
			}

			pointers[pointer.id] = pointer;
			this.container.releasePointerCapture(pointer.id);
			if (this.toolController.dispatchEvent({
				kind: InputEvtType.PointerUpEvt,
				current: pointer,
				allPointers: getPointerList(),
			})) {
				evt.preventDefault();
			}
			delete pointers[pointer.id];
		});

		this.container.addEventListener('wheel', evt => {
			let delta = Vec3.of(evt.deltaX, evt.deltaY, evt.deltaZ);

			if (evt.deltaMode === WheelEvent.DOM_DELTA_LINE) {
				delta = delta.times(15);
			} else if (evt.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
				delta = delta.times(100);
			}

			if (evt.ctrlKey) {
				delta = Vec3.of(0, 0, evt.deltaY);
			}

			const pos = Vec2.of(evt.clientX, evt.clientY);
			if (this.toolController.dispatchEvent({
				kind: InputEvtType.WheelEvt,
				delta,
				screenPos: pos,
			})) {
				evt.preventDefault();
			}
		});

		window.addEventListener('resize', () => {
			this.rerender();
		});
	}

	public dispatch(command: Command) {
		// .push applies [command] to this
		this.history.push(command);
	}

	private resizeDrawingSurfaces() {
		if (this.canvas.clientWidth != this.canvas.width
				|| this.canvas.clientHeight != this.canvas.height) {
			this.canvas.width = this.canvas.clientWidth;
			this.canvas.height = this.canvas.clientHeight;
			this.viewport.updateScreenSize(Vec2.of(this.canvas.width, this.canvas.height));
		}
	}

	private rerenderQueued: boolean = false;
	public queueRerender() {
		if (!this.rerenderQueued) {
			this.rerenderQueued = true;
			requestAnimationFrame(() => {
				this.rerenderQueued = false;
				this.rerender();
			});
		}
	}

	public rerender() {
		this.resizeDrawingSurfaces();
		this.canvasRenderer.clear();
		this.image.render(this.canvasRenderer, this.viewport);
	}

	public toSVG(): SVGElement {
		return null;
	}
}

export default ImageEditor;

//
//
//
// class EditorToolbar {
// // Class name used for styling the toolbar container with CSS.
// private static containerClass = 'EditorToolbar';
//
// private buttons: Record<ToolID, HTMLButtonElement>;
// public constructor(readonly parent: HTMLElement,
// 					   readonly translationTable: Record<string, string>) {
// this.container = document.createElement('div');
// this.container.classList.add(EditorToolbar.containerClass);
// parent.appendChild(this.container);
// }
//
// public registerTool(tool: Tool) {
// // getButtonData() → ButtonDescription
// }
// }
//
// enum ToolID {
// Pen,
// Eraser,
// Zoom,
// }
//
// interface ButtonDescription {
// icon: string|Image|HTMLElement;
// longDescription: string;
// shortDescription: string;
// }
//
// abstract class Tool {
// public constructor(public readonly id: ToolID) {
// }
//
// /**
// 	 * Register [listener], which is called whenever the tool can/can no longer
// 	 * be enabled.
// 	 * /
// public setOnDisabledChangedListener(listener: (disabled: boolean)=>void) { }
//
// /**
// 	 * @return how this tool's toolbar button should look/behave.
// 	 * /
// public abstract getButtonData(): ButtonDescription;
//
// /**
// 	 * Called when the user activates this tool (e.g. clicks on
// 	 * its icon in the toolbar.
//
// 	 * @return true iff the activation/deactivation should proceed.
// 	 * /
// public abstract onActivate(): boolean;
// public abstract onDeactivate(): boolean;
//
// public onPointerDown(): boolean;
// public onPointerMove(): boolean;
// public onPointerUp(): boolean;
// }
//
// class Pen extends Tool {
// public onActivate();
// public onDeactivate();
// public onActionDown(): boolean;
// public onActionMove(): boolean;
// public onActionUp(): boolean;
// }
//
// class Zoom extends Tool {
// ;
// }
//
