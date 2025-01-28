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
			public append = jest.fn();
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

		expect(menu.append).toHaveBeenCalledTimes(2);
		expect(menu.append).toHaveBeenNthCalledWith(1,
			{ value: expect.objectContaining({ id: 'restoreNote' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(2,
			{ value: expect.objectContaining({ id: 'permanentlyDeleteNote' }) },
		);
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

		expect(menu.append).toHaveBeenCalledTimes(14);
		expect(menu.append).toHaveBeenNthCalledWith(1,
			{ value: expect.objectContaining({ id: 'openNoteInNewWindow' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(2,
			{ value: expect.objectContaining({ id: 'startExternalEditing' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(3,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(4,
			{ value: expect.objectContaining({ id: 'setTags' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(5,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(6,
			{ value: expect.objectContaining({ id: 'toggleNoteType' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(7,
			{ value: expect.objectContaining({ id: 'moveToFolder' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(8,
			{ value: expect.objectContaining({ id: 'duplicateNote' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(9,
			{ value: expect.objectContaining({ id: 'deleteNote' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(10,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(11,
			{ value: expect.objectContaining({ label: 'Copy Markdown link' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(12,
			{ value: expect.objectContaining({ label: 'Copy external link' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(13,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(14,
			{ value: expect.objectContaining({ label: 'Export' }) },
		);
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

		expect(menu.append).toHaveBeenCalledTimes(11);
		// expect(menu.append).toHaveBeenNthCalledWith(1,
		// 	{ value: expect.objectContaining({ id: 'openNoteInNewWindow' }) },
		// );
		// expect(menu.append).toHaveBeenNthCalledWith(2,
		// 	{ value: expect.objectContaining({ id: 'startExternalEditing' }) },
		// );
		// expect(menu.append).toHaveBeenNthCalledWith(3,
		// 	{ value: expect.objectContaining({ type: 'separator' }) },
		// );

		expect(menu.append).toHaveBeenNthCalledWith(1,
			{ value: expect.objectContaining({ id: 'setTags' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(2,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(3,
			{ value: expect.objectContaining({ label: 'Switch to note type' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(4,
			{ value: expect.objectContaining({ label: 'Switch to to-do type' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(5,
			{ value: expect.objectContaining({ id: 'moveToFolder' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(6,
			{ value: expect.objectContaining({ id: 'duplicateNote' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(7,
			{ value: expect.objectContaining({ id: 'deleteNote' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(8,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(9,
			{ value: expect.objectContaining({ label: 'Copy Markdown link' }) },
		);
		expect(menu.append).toHaveBeenNthCalledWith(10,
			{ value: expect.objectContaining({ type: 'separator' }) },
		);

		expect(menu.append).toHaveBeenNthCalledWith(11,
			{ value: expect.objectContaining({ label: 'Export' }) },
		);

	});
});
