import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { AppState } from '../app.reducer';
import InteropService from '@joplin/lib/services/interop/InteropService';
import { defaultWindowId, stateUtils } from '@joplin/lib/reducer';
import CommandService from '@joplin/lib/services/CommandService';
import MenuUtils from '@joplin/lib/services/commands/MenuUtils';
import KeymapService from '@joplin/lib/services/KeymapService';
import { PluginStates, utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import shim from '@joplin/lib/shim';
import Setting from '@joplin/lib/models/Setting';
import versionInfo, { PackageInfo } from '@joplin/lib/versionInfo';
import makeDiscourseDebugUrl from '@joplin/lib/makeDiscourseDebugUrl';
import { ImportModule } from '@joplin/lib/services/interop/Module';
import InteropServiceHelper from '../InteropServiceHelper';
import { _ } from '@joplin/lib/locale';
import { isContextMenuItemLocation, MenuItem, MenuItemLocation } from '@joplin/lib/services/plugins/api/types';
import SpellCheckerService from '@joplin/lib/services/spellChecker/SpellCheckerService';
import menuCommandNames from './menuCommandNames';
import stateToWhenClauseContext from '../services/commands/stateToWhenClauseContext';
import bridge from '../services/bridge';
import checkForUpdates from '../checkForUpdates';
import { connect } from 'react-redux';
import { reg } from '@joplin/lib/registry';
import { ProfileConfig } from '@joplin/lib/services/profileConfig/types';
import PluginService, { PluginSettings } from '@joplin/lib/services/plugins/PluginService';
import { getListRendererById, getListRendererIds } from '@joplin/lib/services/noteList/renderers';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import { EventName } from '@joplin/lib/eventManager';
import { ipcRenderer } from 'electron';
import NavService from '@joplin/lib/services/NavService';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('MenuBar');

const packageInfo: PackageInfo = require('../packageInfo.js');
const { clipboard } = require('electron');
const Menu = bridge().Menu;

const menuUtils = new MenuUtils(CommandService.instance());

function pluginMenuItemsCommandNames(menuItems: MenuItem[]): string[] {
	let output: string[] = [];
	for (const menuItem of menuItems) {
		if (menuItem.submenu) {
			output = output.concat(pluginMenuItemsCommandNames(menuItem.submenu));
		} else {
			if (menuItem.commandName) output.push(menuItem.commandName);
		}
	}
	return output;
}

function getPluginCommandNames(plugins: PluginStates): string[] {
	let output: string[] = [];

	for (const view of pluginUtils.viewsByType(plugins, 'menu')) {
		output = output.concat(pluginMenuItemsCommandNames(view.menuItems));
	}

	for (const view of pluginUtils.viewsByType(plugins, 'menuItem')) {
		if (view.commandName) output.push(view.commandName);
	}

	return output;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function createPluginMenuTree(label: string, menuItems: MenuItem[], onMenuItemClick: Function) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const output: any = {
		label: label,
		submenu: [],
	};

	for (const menuItem of menuItems) {
		if (menuItem.submenu) {
			output.submenu.push(createPluginMenuTree(menuItem.label, menuItem.submenu, onMenuItemClick));
		} else {
			output.submenu.push(menuUtils.commandToMenuItem(menuItem.commandName, onMenuItemClick));
		}
	}

	return output;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useSwitchProfileMenuItems = (profileConfig: ProfileConfig, menuItemDic: any) => {
	return useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const switchProfileMenuItems: any[] = [];

		for (let i = 0; i < profileConfig.profiles.length; i++) {
			const profile = profileConfig.profiles[i];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let menuItem: any = {};
			const profileNum = i + 1;
			if (menuItemDic[`switchProfile${profileNum}`]) {
				menuItem = { ...menuItemDic[`switchProfile${profileNum}`] };
			} else {
				menuItem = {
					label: profile.name,
					click: () => {
						void CommandService.instance().execute('switchProfile', profile.id);
					},
				};
			}

			menuItem.label = profile.name;
			menuItem.type = 'checkbox';
			menuItem.checked = profileConfig.currentProfileId === profile.id;

			switchProfileMenuItems.push(menuItem);
		}

		switchProfileMenuItems.push({ type: 'separator' });
		switchProfileMenuItems.push(menuItemDic.addProfile);
		switchProfileMenuItems.push(menuItemDic.editProfileConfig);

		return switchProfileMenuItems;
	}, [profileConfig, menuItemDic]);
};

const useNoteListMenuItems = (noteListRendererIds: string[]) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [menuItems, setMenuItems] = useState<any[]>([]);

	useAsyncEffect(async (event) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const output: any[] = [];
		for (const id of noteListRendererIds) {
			const renderer = getListRendererById(id);

			output.push({
				id: `noteListRenderer_${id}`,
				label: await renderer.label(),
				type: 'checkbox',
				click: () => {
					Setting.setValue('notes.listRendererId', id);
				},
			});

			if (event.cancelled) return;
		}

		setMenuItems(output);
	}, [noteListRendererIds]);

	return menuItems;
};

interface Props {
	// eslint-disable-next-line @typescript-eslint/ban-types
	dispatch: Function;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	menuItemProps: any;
	mainScreenVisible: boolean;
	selectedFolderId: string;
	layoutButtonSequence: number;
	['notes.sortOrder.field']: string;
	['folders.sortOrder.field']: string;
	['notes.sortOrder.reverse']: boolean;
	['folders.sortOrder.reverse']: boolean;
	showNoteCounts: boolean;
	uncompletedTodosOnTop: boolean;
	showCompletedTodos: boolean;
	tabMovesFocus: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pluginMenuItems: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pluginMenus: any[];
	['spellChecker.enabled']: boolean;
	['spellChecker.languages']: string[];
	plugins: PluginStates;
	customCss: string;
	locale: string;
	profileConfig: ProfileConfig;
	pluginSettings: PluginSettings;
	noteListRendererIds: string[];
	noteListRendererId: string;
	windowId: string;
	secondaryWindowFocused: boolean;
	showMenuBar: boolean;
}

const commandNames: string[] = menuCommandNames();

function menuItemSetChecked(id: string, checked: boolean) {
	const menu = Menu.getApplicationMenu();
	const menuItem = menu.getMenuItemById(id);
	if (!menuItem) return;
	menuItem.checked = checked;
}

function menuItemSetEnabled(id: string, enabled: boolean) {
	const menu = Menu.getApplicationMenu();
	const menuItem = menu.getMenuItemById(id);
	if (!menuItem) return;
	menuItem.enabled = enabled;
}

const applyMenuBarVisibility = (windowId: string, showMenuBar: boolean) => {
	// The menu bar cannot be hidden on macOS
	if (shim.isMac()) return;

	const window = bridge().windowById(windowId) ?? bridge().mainWindow();
	window.setAutoHideMenuBar(!showMenuBar);
	window.setMenuBarVisibility(showMenuBar);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useMenuStates(menu: any, props: Props) {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let timeoutId: any = null;

		function scheduleUpdate() {
			if (!timeoutId) return; // Was cancelled
			timeoutId = null;

			const whenClauseContext = CommandService.instance().currentWhenClauseContext();

			for (const commandName in props.menuItemProps) {
				const p = props.menuItemProps[commandName];
				if (!p) continue;
				const enabled = 'enabled' in p ? p.enabled : CommandService.instance().isEnabled(commandName, whenClauseContext);
				menuItemSetEnabled(commandName, enabled);
			}

			const layoutButtonSequenceOptions = Setting.enumOptions('layoutButtonSequence');
			for (const value in layoutButtonSequenceOptions) {
				menuItemSetChecked(`layoutButtonSequence_${value}`, props.layoutButtonSequence === Number(value));
			}

			const listRendererIds = getListRendererIds();
			for (const id of listRendererIds) {
				menuItemSetChecked(`noteListRenderer_${id}`, props.noteListRendererId === id);
			}

			function applySortItemCheckState(type: string) {
				const sortOptions = Setting.enumOptions(`${type}.sortOrder.field`);
				for (const field in sortOptions) {
					if (!sortOptions.hasOwnProperty(field)) continue;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					menuItemSetChecked(`sort:${type}:${field}`, (props as any)[`${type}.sortOrder.field`] === field);
				}
				const id = type === 'notes' ? 'toggleNotesSortOrderReverse' : `sort:${type}:reverse`;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				menuItemSetChecked(id, (props as any)[`${type}.sortOrder.reverse`]);
			}

			applySortItemCheckState('notes');
			applySortItemCheckState('folders');

			menuItemSetChecked('showNoteCounts', props.showNoteCounts);
			menuItemSetChecked('uncompletedTodosOnTop', props.uncompletedTodosOnTop);
			menuItemSetChecked('showCompletedTodos', props.showCompletedTodos);
			menuItemSetChecked('toggleTabMovesFocus', props.tabMovesFocus);
		}

		timeoutId = setTimeout(scheduleUpdate, 150);

		return () => {
			clearTimeout(timeoutId);
			timeoutId = null;
		};
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
	}, [
		props.menuItemProps,
		props.layoutButtonSequence,
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
		props['notes.sortOrder.field'],
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
		props['folders.sortOrder.field'],
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
		props['notes.sortOrder.reverse'],
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
		props['folders.sortOrder.reverse'],
		props.tabMovesFocus,
		props.noteListRendererId,
		props.showNoteCounts,
		props.uncompletedTodosOnTop,
		props.showCompletedTodos,
		menu,
	]);
}

function useMenu(props: Props) {
	const [menu, setMenu] = useState(null);
	const [keymapLastChangeTime, setKeymapLastChangeTime] = useState(Date.now());
	const [modulesLastChangeTime, setModulesLastChangeTime] = useState(Date.now());

	// We use a ref here because the plugin state can change frequently when
	// switching note since any plugin view might be rendered again. However we
	// need this plugin state only in a click handler when exporting notes, and
	// for that a ref is sufficient.
	const pluginsRef = useRef(props.plugins);

	const onMenuItemClick = useCallback((commandName: string) => {
		void CommandService.instance().execute(commandName);
	}, []);

	const onImportModuleClick = useCallback(async (module: ImportModule, moduleSource: string) => {
		let path = null;

		if (moduleSource === 'file') {
			path = await bridge().showOpenDialog({
				filters: [{ name: module.description, extensions: module.fileExtensions }],
			});
		} else {
			path = await bridge().showOpenDialog({
				properties: ['openDirectory', 'createDirectory'],
			});
		}

		if (!path || (Array.isArray(path) && !path.length)) return;

		if (Array.isArray(path)) path = path[0];

		const modalMessage = _('Importing from "%s" as "%s" format. Please wait...', path, module.format);

		void CommandService.instance().execute('showModalMessage', modalMessage);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const errors: any[] = [];

		const importOptions = {
			path,
			format: module.format,
			outputFormat: module.outputFormat,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onProgress: (status: any) => {
				const statusStrings: string[] = Object.keys(status).map((key: string) => {
					return `${key}: ${status[key]}`;
				});

				void CommandService.instance().execute('showModalMessage', `${modalMessage}\n\n${statusStrings.join('\n')}`);
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onError: (error: any) => {
				errors.push(error);
				console.warn(error);
			},
			destinationFolderId: !module.isNoteArchive && moduleSource === 'file' ? props.selectedFolderId : null,
		};

		const service = InteropService.instance();
		try {
			const result = await service.import(importOptions);
			// eslint-disable-next-line no-console
			console.info('Import result: ', result);
		} catch (error) {
			bridge().showErrorMessageBox(error.message);
		}

		void CommandService.instance().execute('hideModalMessage');

		if (errors.length) {
			const response = bridge().showErrorMessageBox('There was some errors importing the notes - check the console for more details.\n\nPlease consider sending a bug report to the forum!', {
				buttons: [_('Close'), _('Send bug report')],
			});

			props.dispatch({ type: 'NOTE_DEVTOOLS_SET', value: true });

			if (response === 1) {
				const url = makeDiscourseDebugUrl(
					`Error importing notes from format: ${module.format}`,
					`- Input format: ${module.format}\n- Output format: ${module.outputFormat}`,
					errors,
					packageInfo,
					PluginService.instance(),
					props.pluginSettings,
				);

				void bridge().openExternal(url);
			}
		}
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
	}, [props.selectedFolderId, props.pluginSettings]);

	const onMenuItemClickRef = useRef(null);
	onMenuItemClickRef.current = onMenuItemClick;

	const onImportModuleClickRef = useRef(null);
	onImportModuleClickRef.current = onImportModuleClick;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pluginCommandNames = useMemo(() => props.pluginMenuItems.map((view: any) => view.commandName), [props.pluginMenuItems]);

	const menuItemDic = useMemo(() => {
		return menuUtils.commandsToMenuItems(
			commandNames.concat(pluginCommandNames),
			(commandName: string) => onMenuItemClickRef.current(commandName),
			props.locale,
		);
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
	}, [commandNames, pluginCommandNames, props.locale]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const switchProfileMenuItems: any[] = useSwitchProfileMenuItems(props.profileConfig, menuItemDic);

	const noteListMenuItems = useNoteListMenuItems(props.noteListRendererIds);

    // Dark Mode Implementation

    const useThemeSync = () => {
        useEffect(() => {
            const updateTheme = () => {
                const isDark = Setting.value('theme') === 2;
                document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            };
            updateTheme();
            Setting.onChange(() => updateTheme());
            return () => {
                Setting.offChange(updateTheme);
            };
        }, []);
    };

    useThemeSync();
    // End Dark Mode Implementation

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let timeoutId: any = null;

		function updateMenu() {
			if (!timeoutId) return; // Has been cancelled

			const keymapService = KeymapService.instance();

			const fileMenu = {
				label: _('File'),
				submenu: [
					menuItemDic.newNote,
					menuItemDic.newTodo,
					{ type: 'separator' },
					menuItemDic.importFile,
					menuItemDic.exportFile,
					{ type: 'separator' },
					menuItemDic.synchronise,
					{ type: 'separator' },
					shim.isMac() ? { label: _('Close'), accelerator: 'CmdOrCtrl+W', role: 'close' } : menuItemDic.closeWindow,
					shim.isMac() ? { label: _('Quit'), accelerator: 'CmdOrCtrl+Q', role: 'quit' } : menuItemDic.exit,
				],
			};

			const editMenu = {
				label: _('Edit'),
				submenu: [
					menuItemDic.undo,
					menuItemDic.redo,
					{ type: 'separator' },
					menuItemDic.cut,
					menuItemDic.copy,
					menuItemDic.paste,
					menuItemDic.selectAll,
					{ type: 'separator' },
					menuItemDic.deleteNote,
					menuItemDic.removeNote,
					{ type: 'separator' },
					menuItemDic.gotoNextUncompletedTodo,
					menuItemDic.gotoPreviousUncompletedTodo,
				],
			};

            // Dark Mode Menu Item
			const viewMenu = {
				label: _('View'),
				submenu: [
					menuItemDic.toggleSideBar,
					menuItemDic.toggleNoteList,
					menuItemDic.toggleEditorToolbar,
					{ type: 'separator' },
					{
						label: _('Dark Mode'),
						type: 'checkbox',
						checked: Setting.value('theme') === 2,
						click: async () => {
							const isDark = Setting.value('theme') === 2;
							await Setting.setValue('theme', isDark ? 1 : 2);
						},
					},
                    // ... other view menu items
				],
			};

			const noteMenu = {
				label: _('Note'),
				submenu: [
					menuItemDic.moveToFolder,
					menuItemDic.copyNote,
					{ type: 'separator' },
					menuItemDic.duplicateNote,
					menuItemDic.splitNote,
					{ type: 'separator' },
					menuItemDic.copyNoteUrl,
					{ type: 'separator' },
					menuItemDic.toggleTodoCompleted,
					{ type: 'separator' },
					menuItemDic.print,
					menuItemDic.exportPdf,
				],
			};

			const folderMenu = {
				label: _('Folder'),
				submenu: [
					menuItemDic.newFolder,
					menuItemDic.newTodoFolder,
					{ type: 'separator' },
					menuItemDic.renameFolder,
					menuItemDic.deleteFolder,
					{ type: 'separator' },
					menuItemDic.exportFolder,
				],
			};

			const toolsMenu = {
				label: _('Tools'),
				submenu: [
					menuItemDic.options,
					menuItemDic.editTemplates,
					{ type: 'separator' },
					menuItemDic.synchronisation,
					{ type: 'separator' },
					menuItemDic.showMasterKeys,
					menuItemDic.importEnexFile,
					{ type: 'separator' },
					menuItemDic.showProfileScreen,
					{
						label: _('Switch profile'),
						submenu: switchProfileMenuItems,
					},
					{ type: 'separator' },
					{
						label: _('Sort notes by'),
						submenu: [
							{
								label: _('Title'),
								submenu: [
									{
										id: 'sort:notes:title',
										label: _('Ascending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'title');
											Setting.setValue('notes.sortOrder.reverse', 0);
										},
									},
									{
										id: 'toggleNotesSortOrderReverse',
										label: _('Descending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'title');
											Setting.setValue('notes.sortOrder.reverse', 1);
										},
									},
								],
							},
							{
								label: _('Created date'),
								submenu: [
									{
										id: 'sort:notes:created_time',
										label: _('Ascending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'created_time');
											Setting.setValue('notes.sortOrder.reverse', 0);
										},
									},
									{
										id: 'toggleNotesSortOrderReverse',
										label: _('Descending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'created_time');
											Setting.setValue('notes.sortOrder.reverse', 1);
										},
									},
								],
							},
							{
								label: _('Updated date'),
								submenu: [
									{
										id: 'sort:notes:updated_time',
										label: _('Ascending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'updated_time');
											Setting.setValue('notes.sortOrder.reverse', 0);
										},
									},
									{
										id: 'toggleNotesSortOrderReverse',
										label: _('Descending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'updated_time');
											Setting.setValue('notes.sortOrder.reverse', 1);
										},
									},
								],
							},
							{
								label: _('Custom order'),
								submenu: [
									{
										id: 'sort:notes:order',
										label: _('Ascending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'order');
											Setting.setValue('notes.sortOrder.reverse', 0);
										},
									},
									{
										id: 'toggleNotesSortOrderReverse',
										label: _('Descending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('notes.sortOrder.field', 'order');
											Setting.setValue('notes.sortOrder.reverse', 1);
										},
									},
								],
							},
						],
					},
					{
						label: _('Sort folders by'),
						submenu: [
							{
								label: _('Title'),
								submenu: [
									{
										id: 'sort:folders:title',
										label: _('Ascending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('folders.sortOrder.field', 'title');
											Setting.setValue('folders.sortOrder.reverse', 0);
										},
									},
									{
										id: 'sort:folders:reverse',
										label: _('Descending'),
										type: 'checkbox',
										click: () => {
											Setting.setValue('folders.sortOrder.field', 'title');
											Setting.setValue('folders.sortOrder.reverse', 1);
										},
									},
								],
							},
						],
					},
					{ type: 'separator' },
					{
						label: _('Note list appearance'),
						submenu: noteListMenuItems,
					},
					{
						label: _('Layout button sequence'),
						submenu: [
							{
								id: 'layoutButtonSequence_1',
								label: _('Single column (note list on top)'),
								type: 'checkbox',
								click: () => {
									Setting.setValue('layoutButtonSequence', 1);
								},
							},
							{
								id: 'layoutButtonSequence_2',
								label: _('Single column (note list at the bottom)'),
								type: 'checkbox',
								click: () => {
									Setting.setValue('layoutButtonSequence', 2);
								},
							},
							{
								id: 'layoutButtonSequence_3',
								label: _('Two columns (note list on the left)'),
								type: 'checkbox',
								click: () => {
									Setting.setValue('layoutButtonSequence', 3);
								},
							},
							{
								id: 'layoutButtonSequence_4',
								label: _('Two columns (note list on the right)'),
								type: 'checkbox',
								click: () => {
									Setting.setValue('layoutButtonSequence', 4);
								},
							},
							{
								id: 'layoutButtonSequence_5',
								label: _('Three columns'),
								type: 'checkbox',
								click: () => {
									Setting.setValue('layoutButtonSequence', 5);
								},
							},
						],
					},
					{ type: 'separator' },
					{
						id: 'showNoteCounts',
						label: _('Show note counts'),
						type: 'checkbox',
						click: () => {
							Setting.setValue('showNoteCounts', !props.showNoteCounts);
						},
					},
					{
						id: 'uncompletedTodosOnTop',
						label: _('Uncompleted to-dos on top'),
						type: 'checkbox',
						click: () => {
							Setting.setValue('uncompletedTodosOnTop', !props.uncompletedTodosOnTop);
						},
					},
					{
						id: 'showCompletedTodos',
						label: _('Show completed to-dos'),
						type: 'checkbox',
						click: () => {
							Setting.setValue('showCompletedTodos', !props.showCompletedTodos);
						},
					},
					{ type: 'separator' },
					menuItemDic.toggleDevTools,
				],
			};

			const helpMenu = {
				label: _('Help'),
				submenu: [
					menuItemDic.checkForUpdates,
					{ type: 'separator' },
					menuItemDic.openHelp,
					{ type: 'separator' },
					menuItemDic.reportABug,
					menuItemDic.openDiscussions,
					{ type: 'separator' },
					menuItemDic.about,
				],
			};

			const spellCheckerMenu = SpellCheckerService.instance().mainMenu(props['spellChecker.enabled'], props['spellChecker.languages']);

			const windowMenu = {
				label: _('Window'),
				submenu: [
					menuItemDic.zoomIn,
					menuItemDic.zoomOut,
					{ type: 'separator' },
					menuItemDic.toggleFullScreen,
					{ type: 'separator' },
					menuItemDic.focusNextWindow,
					menuItemDic.focusPreviousWindow,
					{ type: 'separator' },
					menuItemDic.toggleTabMovesFocus,
					{ type: 'separator' },
					menuItemDic.closeWindow,
				],
			};

			if (!shim.isMac()) windowMenu.submenu.push(menuItemDic.exit);

			const pluginMenuTrees = [];
			for (const pluginMenu of props.pluginMenus) {
				pluginMenuTrees.push(createPluginMenuTree(pluginMenu.label, pluginMenu.menuItems, onMenuItemClick));
			}

			const menuTemplate = [
				fileMenu,
				editMenu,
				viewMenu,
				noteMenu,
				folderMenu,
				toolsMenu,
				windowMenu,
				spellCheckerMenu,
				...pluginMenuTrees,
				helpMenu,
			];

			const menu0 = Menu.buildFromTemplate(menuTemplate);

			if (shim.isMac()) {
				Menu.setApplicationMenu(menu0);
			}

			useMenuStates(menu0, props);
			setMenu(menu0);
		}

		timeoutId = setTimeout(updateMenu, 100);

		return () => {
			clearTimeout(timeoutId);
		};
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps
	}, [
		keymapLastChangeTime,
		modulesLastChangeTime,
		props.mainScreenVisible,
		props.selectedFolderId,
		pluginsRef.current,
		props.locale,
		props.pluginMenuItems,
		pluginCommandNames,
		switchProfileMenuItems,
		props.noteListRendererIds,
		props.pluginMenus,
	]);

	useEffect(() => {
		const eventHandler = () => {
			setKeymapLastChangeTime(Date.now());
		};

		KeymapService.instance().on(EventName.Changed, eventHandler);

		return () => {
			KeymapService.instance().off(EventName.Changed, eventHandler);
		};
	}, []);

	useEffect(() => {
		const eventHandler = () => {
			setModulesLastChangeTime(Date.now());
		};

		PluginService.instance().on('modulesLastChangeTime', eventHandler);

		return () => {
			PluginService.instance().off('modulesLastChangeTime', eventHandler);
		};
	}, []);

	useEffect(() => {
		applyMenuBarVisibility(props.windowId, props.showMenuBar);
	}, [props.windowId, props.showMenuBar]);

	return menu;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = (props: Props) => {
	useMenu(props);
	return null;
};

const mapState = (state: AppState) => {
	return {
		mainScreenVisible: stateUtils.mainScreenVisible(state),
		selectedFolderId: state.selectedFolderId,
		layoutButtonSequence: state.layoutButtonSequence,
		'notes.sortOrder.field': state.settings['notes.sortOrder.field'],
		'folders.sortOrder.field': state.settings['folders.sortOrder.field'],
		'notes.sortOrder.reverse': state.settings['notes.sortOrder.reverse'],
		'folders.sortOrder.reverse': state.settings['folders.sortOrder.reverse'],
		showNoteCounts: state.settings.showNoteCounts,
		uncompletedTodosOnTop: state.settings.uncompletedTodosOnTop,
		showCompletedTodos: state.settings.showCompletedTodos,
		tabMovesFocus: state.settings.tabMovesFocus,
		menuItemProps: state.menuItemProps,
		pluginMenuItems: pluginUtils.viewsByType(state.plugins, 'menuItem'),
		pluginMenus: pluginUtils.viewsByType(state.plugins, 'menu'),
		'spellChecker.enabled': state.settings['spellChecker.enabled'],
		'spellChecker.languages': state.settings['spellChecker.languages'],
		plugins: state.plugins,
		customCss: state.settings.customCss,
		locale: state.locale,
		profileConfig: state.profileConfig,
		pluginSettings: state.pluginSettings,
		noteListRendererIds: state.noteListRenderers.ids,
		noteListRendererId: state.settings['notes.listRendererId'],
		windowId: state.windowId,
		secondaryWindowFocused: state.secondaryWindowFocused,
		showMenuBar: state.showMenuBar,
	};
};

export default connect(mapState)(MenuBar);


