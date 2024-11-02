/* eslint-disable multiline-comment-style */

import Plugin from '../Plugin';
import createViewHandle from '../utils/createViewHandle';
import WebviewController, { ContainerType } from '../WebviewController';
import { ViewHandle } from './types';

/**
 * Allows creating alternative note editors. When `setActive` is called, this view is going to
 * replace the note editor - you can then handle loading and saving note, and do your own rendering.
 *
 * Although it may be used to implement an alternative text editor, the more common use case may be
 * to render the note in a different, graphical way - for example displaying a graph, and
 * saving/loading the graph data in the associated note. In that case, you would detect whether the
 * current note contains graph data and, in this case, you'd display your viewer. If not, you would
 * hide it.
 *
 * Usually you would listen to the `onNoteChange` event - at that point check the note content, and
 * if your plugin can render it, then call `setActive(handle, true)`. Otherwise make sure to call
 * `setActive(handle, false)`, so that the view is not unnecessarily being displayed.
 *
 * Note that only one editor view can be active at a time. This is why it's important not to
 * activate your view if it's not relevant to the current note.
 */
export default class JoplinViewsEditors {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private store: any;
	private plugin: Plugin;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public constructor(plugin: Plugin, store: any) {
		this.store = store;
		this.plugin = plugin;
	}

	private controller(handle: ViewHandle): WebviewController {
		return this.plugin.viewController(handle) as WebviewController;
	}

	/**
	 * Creates a new editor view
	 */
	public async create(id: string): Promise<ViewHandle> {
		const handle = createViewHandle(this.plugin, id);
		const controller = new WebviewController(handle, this.plugin.id, this.store, this.plugin.baseDir, ContainerType.Editor);
		this.plugin.addViewController(controller);
		return handle;
	}

	/**
	 * Sets the editor HTML content
	 */
	public async setHtml(handle: ViewHandle, html: string): Promise<string> {
		return this.controller(handle).html = html;
	}

	/**
	 * Adds and loads a new JS or CSS file into the panel.
	 */
	public async addScript(handle: ViewHandle, scriptPath: string): Promise<void> {
		return this.controller(handle).addScript(scriptPath);
	}

	/**
	 * See [[JoplinViewPanels]]
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	public async onMessage(handle: ViewHandle, callback: Function): Promise<void> {
		return this.controller(handle).onMessage(callback);
	}

	/**
	 * See [[JoplinViewPanels]]
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public postMessage(handle: ViewHandle, message: any): void {
		return this.controller(handle).postMessage(message);
	}

	/**
	 * Sets the editor as active or inactive for the current note.
	 */
	public async setActive(handle: ViewHandle, active: boolean) {
		return this.controller(handle).setActive(active);
	}

	/**
	 * Tells whether the editor is active or not.
	 */
	public async isActive(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).visible;
	}

	/**
	 * Tells whether the editor is effectively visible or not. If the editor is inactive, this will
	 * return `false`. If the editor is active and the user has switched to it, it will return
	 * `true`. Otherwise it will return `false`.
	 */
	public async isVisible(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).isVisible();
	}

}
