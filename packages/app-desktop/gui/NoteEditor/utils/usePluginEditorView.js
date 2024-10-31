"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const WebviewController_1 = require("@joplin/lib/services/plugins/WebviewController");
const Logger_1 = require("@joplin/utils/Logger");
const logger = Logger_1.default.create('usePluginEditorView');
exports.default = (plugins) => {
    return (0, react_1.useMemo)(() => {
        let output = { editorPlugin: null, editorView: null };
        for (const [, pluginState] of Object.entries(plugins)) {
            for (const [, view] of Object.entries(pluginState.views)) {
                if (view.type === 'webview' && view.containerType === WebviewController_1.ContainerType.Editor && view.opened) {
                    if (output.editorPlugin) {
                        logger.warn('More than one editor plugin are enabled for this note. Enabled plugin: ' + output.editorPlugin.id + '. Ignored plugin: ' + pluginState.id);
                    }
                    else {
                        output = { editorPlugin: pluginState, editorView: view };
                    }
                }
            }
        }
        return output;
    }, [plugins]);
};
//# sourceMappingURL=usePluginEditorView.js.map