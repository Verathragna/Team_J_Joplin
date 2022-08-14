import { execCommand2 } from '@joplin/tools/tool-utils';
import { homedir } from 'os';
import * as fsE from 'fs-extra';

const profileDir = `${homedir()}/.config/joplindev-populate/joplindev-testing-command-mkbook`;

// eC2W is an wrapper for execCommand2
const eC2W = async (command: string) => {
	await execCommand2(`yarn start-no-build --profile ${profileDir} ${command}`, { quiet: true });
};

describe('CreateSubNotebook', function() {

	test('Create notebooks', (async () => {
		await eC2W('mkbook test1');
		await eC2W('mkbook test2');
	}));

	test('Create sub-notebook', (async () => {
		await eC2W('use test1');
		await eC2W('mkbook -s test1.1');
	}));

	test('Create sub-notebook in target notebook', (async () => {
		await eC2W('mkbook -s test2.1 test2');
	}));

	test('Fail create sub-notebook in ambiguous notebook', (async () => {
		await eC2W('mkbook test3');
		await eC2W('mkbook test3');	// ambiguous notebook
		await eC2W('use test3');
		await eC2W('mkbook -s test3.1');

		try {
			await eC2W('mkbook -s test3.2 test3');
			throw new Error('Ambiguous notebooks, it should not work!');
		} catch (e) {
			expect(e.message).toContain('Error:');
		}
	}));

	fsE.removeSync(profileDir);

});

