import NoteListUtils from './NoteListUtils';
import KeymapService from '@joplin/lib/services/KeymapService';
import menuCommandNames from '../menuCommandNames';
import { MenuItem as MenuItemType } from '@joplin/lib/services/commands/MenuUtils';
import initializeCommandService from '../../utils/initializeCommandService';
import { createAppDefaultWindowState } from '../../app.reducer';

jest.mock('../../services/bridge', () => ({
	__esModule: true,
	default: () => ({
		MenuItem: class MenuItem {
			public value: MenuItemType;
			public constructor(value: MenuItemType) {
				this.value = value;
			}
		},
		Menu: class MockMenu {
			public items: MenuItemType[] = [];
			public append(item: MenuItemType) {
				this.items.push(item);
			}
		},
	}),
}));

const mockDispatch = jest.fn();

describe('NoteListUtils', () => {

	beforeEach(() => {
		const mockStore = {
			getState: () => {
				return {
					...createAppDefaultWindowState(),
					settings: {},
				};
			},
		};

		initializeCommandService(mockStore, false);
		const keymapService = KeymapService.instance();
		keymapService.initialize(menuCommandNames());
	});

	it('should show only trash menu options on deleted note', () => {
		const noteIds = ['noteId1'];
		const deletedNote = {
			id: 'noteId1',
			deleted_time: new Date().getTime(),
		};
		const menu = NoteListUtils.makeContextMenu(noteIds, {
			notes: [
				deletedNote,
			],
			dispatch: mockDispatch,
			watchedNoteFiles: [],
			plugins: {},
			inConflictFolder: false,
			customCss: '',
		});

		expect(menu.items).toMatchSnapshot();
	});

	it('should show menu options for normal notes', () => {
		const noteIds = ['noteId1'];
		const normalNote = {
			id: 'noteId1',
		};
		const menu = NoteListUtils.makeContextMenu(noteIds, {
			notes: [
				normalNote,
			],
			dispatch: mockDispatch,
			watchedNoteFiles: [],
			plugins: {},
			inConflictFolder: false,
			customCss: '',
		});

		expect(menu.items).toMatchSnapshot();
	});

	it('should show options when more than one note is selected', () => {
		const noteIds = ['noteId1', 'noteId2'];
		const menu = NoteListUtils.makeContextMenu(noteIds, {
			notes: [
				{ id: 'noteId1' },
				{ id: 'noteId2' },
			],
			dispatch: mockDispatch,
			watchedNoteFiles: [],
			plugins: {},
			inConflictFolder: false,
			customCss: '',
		});

		expect(menu.items).toMatchSnapshot();
	});

	it('should hide all options for encrypted', () => {
		const noteIds = ['noteId1'];
		const encrypted = {
			id: 'noteId1',
			encryption_applied: 1,
		};
		const menu = NoteListUtils.makeContextMenu(noteIds, {
			notes: [
				encrypted,
			],
			dispatch: mockDispatch,
			watchedNoteFiles: [],
			plugins: {},
			inConflictFolder: false,
			customCss: '',
		});

		expect(menu.items).toMatchSnapshot();
	});
});
