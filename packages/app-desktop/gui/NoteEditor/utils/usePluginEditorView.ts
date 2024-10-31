import { useMemo } from 'react';
import { ContainerType } from '@joplin/lib/services/plugins/WebviewController';
import { PluginState, PluginStates, PluginViewState } from '@joplin/lib/services/plugins/reducer';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('usePluginEditorView');

interface Output {
	editorPlugin: PluginState;
	editorView: PluginViewState;
}

export default (plugins: PluginStates) => {
	return useMemo(() => {
		let output: Output = { editorPlugin: null, editorView: null };
		for (const [, pluginState] of Object.entries(plugins)) {
			for (const [, view] of Object.entries(pluginState.views)) {
				if (view.type === 'webview' && view.containerType === ContainerType.Editor && view.opened) {
					if (output.editorPlugin) {
						logger.warn(`More than one editor plugin are enabled for this note. Enabled plugin: ${output.editorPlugin.id}. Ignored plugin: ${pluginState.id}`);
					} else {
						output = { editorPlugin: pluginState, editorView: view };
					}
				}
			}
		}
		return output;
	}, [plugins]);
};
