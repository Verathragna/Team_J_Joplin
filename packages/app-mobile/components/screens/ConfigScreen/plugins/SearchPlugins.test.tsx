import * as React from 'react';
import RepositoryApi, { InstallMode } from '@joplin/lib/services/plugins/RepositoryApi';
import { afterAllCleanUp, afterEachCleanUp, setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';

import SearchPlugins from './SearchPlugins';
import Setting from '@joplin/lib/models/Setting';
import PluginService, { PluginSettings } from '@joplin/lib/services/plugins/PluginService';
import { useMemo } from 'react';
import pluginServiceSetup from './testUtils/pluginServiceSetup';
import newRepoApi from './testUtils/newRepoApi';

interface WrapperProps {
	repoApi: RepositoryApi;
	repoApiInitialized?: boolean;
	pluginSettings?: PluginSettings;
	onUpdatePluginStates?: (states: PluginSettings)=> void;
}

const noOpFunction = ()=>{};

const SearchWrapper = (props: WrapperProps) => {
	const serializedPluginSettings = useMemo(() => {
		return PluginService.instance().serializePluginSettings(props.pluginSettings ?? {});
	}, [props.pluginSettings]);

	return (
		<SearchPlugins
			themeId={Setting.THEME_LIGHT}
			pluginSettings={serializedPluginSettings}
			repoApiInitialized={props.repoApiInitialized ?? true}
			repoApi={props.repoApi}
			onUpdatePluginStates={props.onUpdatePluginStates ?? noOpFunction}
		/>
	);
};

const expectSearchResultCountToBe = async (count: number) => {
	await waitFor(() => {
		expect(screen.queryAllByTestId('plugin-card')).toHaveLength(count);
	});
};

describe('SearchPlugins', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);
		pluginServiceSetup();
	});
	afterEach(() => afterEachCleanUp());
	afterAll(() => afterAllCleanUp());

	it('should find results', async () => {
		const repoApi = await newRepoApi(InstallMode.Default);
		render(<SearchWrapper repoApi={repoApi}/>);

		const searchBox = screen.queryByPlaceholderText('Search');
		expect(searchBox).toBeVisible();

		// No plugin cards should be visible by default
		expect(screen.queryAllByTestId('plugin-card')).toHaveLength(0);

		const user = userEvent.setup();
		await user.type(searchBox, 'backlinks');

		// Should find one result
		await expectSearchResultCountToBe(1);

		// Clearing the search input should hide all results
		await user.clear(searchBox);
		await expectSearchResultCountToBe(0);

		// Typing a space should show all results
		await user.type(searchBox, ' ');
		await waitFor(() => {
			expect(screen.queryAllByTestId('plugin-card').length).toBeGreaterThan(2);
		});
	});

	it('should only show recommended plugin search results on iOS-like environments', async () => {
		// iOS uses restricted install mode
		const repoApi = await newRepoApi(InstallMode.Restricted);
		render(<SearchWrapper repoApi={repoApi}/>);

		const searchBox = screen.queryByPlaceholderText('Search');
		expect(searchBox).toBeVisible();

		const user = userEvent.setup();
		await user.type(searchBox, 'abc');

		// Should find recommended plugins
		await expectSearchResultCountToBe(1);

		// Should not find non-recommended plugins
		await user.clear(searchBox);
		await user.type(searchBox, 'backlinks');
		await expectSearchResultCountToBe(0);

		await user.clear(searchBox);
		await user.type(searchBox, ' ');
		await expectSearchResultCountToBe(1);
		expect(screen.getByText(/ABC Sheet Music/i)).toBeTruthy();
		expect(screen.queryByText(/backlink/i)).toBeNull();
	});
});
