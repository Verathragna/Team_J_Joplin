/* eslint-disable multiline-comment-style */

import Plugin from '../Plugin';
import createViewHandle from '../utils/createViewHandle';
import WebviewController, { ContainerType } from '../WebviewController';
import { ViewHandle } from './types';

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

	public async show(handle: ViewHandle, show = true): Promise<void> {
		await this.controller(handle).show(show);
	}

	public async hide(handle: ViewHandle): Promise<void> {
		await this.show(handle, false);
	}

	public async visible(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).visible;
	}

}
