import * as React from 'react';
import { StyledSyncReportText, StyledSyncReport, StyledSynchronizeButton, StyledRoot } from './styles';
import { ButtonLevel } from '../Button/Button';
import CommandService from '@joplin/lib/services/CommandService';
import Synchronizer from '@joplin/lib/Synchronizer';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../app.reducer';
import { StateDecryptionWorker, StateResourceFetcher } from '@joplin/lib/reducer';
import { connect } from 'react-redux';
import { themeStyle } from '@joplin/lib/theme';
import { Dispatch } from 'redux';
import FolderAndTagList from './FolderAndTagList';

interface Props {
	themeId: number;
	dispatch: Dispatch;
	decryptionWorker: StateDecryptionWorker;
	resourceFetcher: StateResourceFetcher;
	syncReport: any;
	syncStarted: boolean;
}

const SidebarComponent = (props: Props) => {
	const [showFolders, setShowFolders] = React.useState(true);
	const [showTags, setShowTags] = React.useState(true);

	const renderSynchronizeButton = (type: string) => {
		const label = type === 'sync' ? _('Synchronise') : _('Cancel');
		const iconAnimation = type !== 'sync' ? 'icon-infinite-rotation 1s linear infinite' : '';

		return (
			<StyledSynchronizeButton
				level={ButtonLevel.SidebarSecondary}
				iconName="icon-sync"
				key="sync_button"
				iconAnimation={iconAnimation}
				title={label}
				onClick={() => {
					void CommandService.instance().execute('synchronize', type !== 'sync');
				}}
				aria-label={label}
			/>
		);
	};

	const theme = themeStyle(props.themeId);

	let decryptionReportText = '';
	if (props.decryptionWorker?.state !== 'idle' && props.decryptionWorker.itemCount) {
		decryptionReportText = _('Decrypting items: %d/%d', props.decryptionWorker.itemIndex + 1, props.decryptionWorker.itemCount);
	}

	let resourceFetcherText = '';
	if (props.resourceFetcher?.toFetchCount) {
		resourceFetcherText = _('Fetching resources: %d/%d', props.resourceFetcher.fetchingCount, props.resourceFetcher.toFetchCount);
	}

	const lines = Synchronizer.reportToLines(props.syncReport);
	if (resourceFetcherText) lines.push(resourceFetcherText);
	if (decryptionReportText) lines.push(decryptionReportText);

	const syncReportText = lines.map((line, i) => (
		<StyledSyncReportText key={i}>
			{line}
		</StyledSyncReportText>
	));

	const syncButton = renderSynchronizeButton(props.syncStarted ? 'cancel' : 'sync');

	const syncReportComp = syncReportText.length > 0 && (
		<StyledSyncReport key="sync_report">
			{syncReportText}
		</StyledSyncReport>
	);

	return (
		<StyledRoot className="sidebar _scrollbar2" role="navigation" aria-label={_('Sidebar')}>
			<nav style={{ flex: 1, padding: '0 10px' }}>
				{/* Folder Toggle */}
				<div style={{ marginBottom: 10 }}>
					<button
						className="toggle-section"
						onClick={() => setShowFolders(!showFolders)}
						aria-expanded={showFolders}
						aria-controls="folders-section"
					>
						📁 {showFolders ? _('Hide Folders') : _('Show Folders')}
					</button>
				</div>

				{/* Folder/Tag List */}
				{showFolders && (
					<div id="folders-section">
						<FolderAndTagList />
					</div>
				)}

				{/* Tag Toggle */}
				{/* Optional: implement tags as separate section if FolderAndTagList combines both */}
				{/* Add similar toggle here if tags are separate */}
			</nav>

			{/* Sync section */}
			<div style={{ flex: 0, padding: theme.mainPadding, borderTop: `1px solid ${theme.dividerColor}` }}>
				{syncReportComp}
				{syncButton}
			</div>
		</StyledRoot>
	);
};

const mapStateToProps = (state: AppState) => ({
	searches: state.searches,
	syncStarted: state.syncStarted,
	syncReport: state.syncReport,
	selectedSearchId: state.selectedSearchId,
	selectedSmartFilterId: state.selectedSmartFilterId,
	locale: state.settings.locale,
	themeId: state.settings.theme,
	collapsedFolderIds: state.collapsedFolderIds,
	decryptionWorker: state.decryptionWorker,
	resourceFetcher: state.resourceFetcher,
});

export default connect(mapStateToProps)(SidebarComponent);

