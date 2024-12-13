import { createTempDir } from '@joplin/lib/testing/test-utils';
import bridge, { initBridge } from './bridge';
import { join } from 'path';
import { mkdirp } from 'fs-extra';
import { dialog, shell } from 'electron';
import ElectronAppWrapper from './ElectronAppWrapper';

jest.mock('@sentry/electron/main', () => ({
	init: () => { },
}));
jest.mock('electron', () => ({
	dialog: {
		showMessageBox: jest.fn(() => Promise.resolve()),
	},
	shell: {
		openExternal: jest.fn(),
		openPath: jest.fn(),
	},
}));
describe('bridge', () => {

	beforeAll(async () => {
		await initBridge({
			activeWindow: () => {},
		} as ElectronAppWrapper, '', '', '', false);
	});

	it('should open directory if name has no extension', async () => {
		const unsafeExtension = 'name';

		const tempDir = await createTempDir();
		const fullPath = join(tempDir, unsafeExtension);
		await mkdirp(fullPath);

		await bridge().openItem(fullPath);
		expect(dialog.showMessageBox).toHaveBeenCalledTimes(0);
		expect(shell.openPath).toHaveBeenCalledTimes(1);
		expect(shell.openPath).toHaveBeenLastCalledWith(fullPath);
	});

	it('should show warning if opening directory has a unsafe extension', async () => {
		const unsafeExtension = 'name.unsafe';
		dialog.showMessageBox = jest.fn().mockReturnValue({ response: 1 });

		const tempDir = await createTempDir();
		const fullPath = join(tempDir, unsafeExtension);
		await mkdirp(fullPath);

		await bridge().openItem(fullPath);
		expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
		expect(dialog.showMessageBox).toHaveBeenCalledWith(undefined, { 'buttons': ['Cancel', 'Learn more', 'Open it'], 'checkboxLabel': 'Always open ".unsafe" files without asking.', 'message': 'This file seems to be a directory, but Joplin doesn\'t recognise the ".unsafe" extension. Opening this could be dangerous. What would you like to do?', 'title': 'Unknown file type', 'type': 'warning' });
	});
});
