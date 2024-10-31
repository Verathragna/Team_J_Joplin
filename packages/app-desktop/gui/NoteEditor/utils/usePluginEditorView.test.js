"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_utils_1 = require("@joplin/lib/testing/test-utils");
const react_hooks_1 = require("@testing-library/react-hooks");
const usePluginEditorView_1 = require("./usePluginEditorView");
const WebviewController_1 = require("@joplin/lib/services/plugins/WebviewController");
const sampleView = () => {
    return {
        buttons: [],
        containerType: WebviewController_1.ContainerType.Editor,
        id: 'view-1',
        opened: true,
        type: 'webview',
    };
};
describe('usePluginEditorView', () => {
    beforeEach(async () => {
        await (0, test_utils_1.setupDatabaseAndSynchronizer)(1);
        await (0, test_utils_1.switchClient)(1);
    });
    it('should return the plugin editor view if is opened', async () => {
        const pluginStates = {
            '0': {
                contentScripts: {},
                id: '1',
                views: {
                    'view-0': Object.assign(Object.assign({}, sampleView()), { id: 'view-0', containerType: WebviewController_1.ContainerType.Panel }),
                }
            },
            '1': {
                contentScripts: {},
                id: '1',
                views: {
                    'view-1': sampleView(),
                }
            },
        };
        {
            const test = (0, react_hooks_1.renderHook)(() => (0, usePluginEditorView_1.default)(pluginStates));
            expect(test.result.current.editorPlugin.id).toBe('1');
            expect(test.result.current.editorView.id).toBe('view-1');
            test.unmount();
        }
        {
            pluginStates['1'].views['view-1'].opened = false;
            const test = (0, react_hooks_1.renderHook)(() => (0, usePluginEditorView_1.default)(pluginStates));
            expect(test.result.current.editorPlugin).toBeFalsy();
            test.unmount();
        }
    });
    it('should return a plugin editor view even if multiple editors are conflicting', async () => {
        const pluginStates = {
            '1': {
                contentScripts: {},
                id: '1',
                views: {
                    'view-1': sampleView(),
                }
            },
            '2': {
                contentScripts: {},
                id: '2',
                views: {
                    'view-2': Object.assign(Object.assign({}, sampleView()), { id: 'view-2' }),
                }
            },
        };
        {
            const test = (0, react_hooks_1.renderHook)(() => (0, usePluginEditorView_1.default)(pluginStates));
            expect(test.result.current.editorPlugin.id).toBe('1');
            expect(test.result.current.editorView.id).toBe('view-1');
            test.unmount();
        }
    });
});
//# sourceMappingURL=usePluginEditorView.test.js.map