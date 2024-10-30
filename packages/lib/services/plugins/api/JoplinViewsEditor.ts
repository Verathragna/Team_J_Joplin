/* eslint-disable multiline-comment-style */

import Plugin from '../Plugin';
import createViewHandle from '../utils/createViewHandle';
import WebviewController, { ContainerType } from '../WebviewController';
import { ViewHandle } from './types';

/**
 * Allows creating alternative note editors. When `show` is called, this view is going to replace
 * the note editor - you can then handle loading and saving note, and do your own rendering.
 *
 * Although it may be used to implement an alternative text editor, the more common use case may be
 * to render the note in a different, graphical way - for example displaying a graph, and
 * saving/loading the graph data in the associated note. In that case, you would detect whether the
 * current note contains graph data and, in this case, you'd display your viewer. If not, you would
 * hide it.
 *
 * Usually you would listen to the `onNoteChange` event - at that point check the note content, and
 * if your plugin can render it, then call `show()`. Otherwise make sure to call `hide()`, so that
 * the view is not unnecessarily being displayed.
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

	public async create(id: string): Promise<ViewHandle> {
		const handle = createViewHandle(this.plugin, id);
		const controller = new WebviewController(handle, this.plugin.id, this.store, this.plugin.baseDir, ContainerType.Editor);
		this.plugin.addViewController(controller);
		return handle;
	}

	public async setHtml(handle: ViewHandle, html: string): Promise<string> {
		return this.controller(handle).html = html;
	}

	public async addScript(handle: ViewHandle, scriptPath: string): Promise<void> {
		return this.controller(handle).addScript(scriptPath);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	public async onMessage(handle: ViewHandle, callback: Function): Promise<void> {
		return this.controller(handle).onMessage(callback);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public postMessage(handle: ViewHandle, message: any): void {
		return this.controller(handle).postMessage(message);
	}

	/**
	 * Tells the application that the editor may be shown. Note that the user can toggle between
	 * your editor and the built-in text editor, so you are not guaranteed that the editor will
	 * actually be visible. This only tells the app that the user can choose to display the editor.
	 */
	public async show(handle: ViewHandle, show = true): Promise<void> {
		await this.controller(handle).show(show);
	}

	/**
	 * Tells the application that the editor is not available in the current context.
	 */
	public async hide(handle: ViewHandle): Promise<void> {
		await this.show(handle, false);
	}

	/**
	 * Tells whether the editor is visible or not.
	 */
	public async visible(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).visible;
	}

}
