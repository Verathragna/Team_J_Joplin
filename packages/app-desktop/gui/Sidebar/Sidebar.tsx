import * as React from 'react';
import { useState } from 'react';
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	syncReport: any;
	syncStarted: boolean;
	collapsedFolderIds: string[];
}

const SidebarComponent = (props: Props) => {
	const [foldersCollapsed, setFoldersCollapsed] = useState(false);
	const [tagsCollapsed, setTagsCollapsed] = useState(false);
	const theme = themeStyle(props.themeId);

	const renderSectionHeader = (title: string, collapsed: boolean, onToggle: () => void) => {
		return (
			<div 
				role="button"
				tabIndex={0}
				aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
				className="section-header"
				onClick={onToggle}
				onKeyPress={(e) => ['Enter', ' '].includes(e.key) && onToggle()}
				style={{
					padding: `${theme.mainPadding}px 0`,
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					backgroundColor: collapsed ? theme.backgroundColorHover : 'transparent',
					transition: 'background-color 0.2s ease',
				}}
			>
				<i className={`icon ${title === 'Folders' ? 'icon-folder' : 'icon-tag'}`} />
				<h3 style={{ 
					margin: 0,
					fontSize: theme.fontSize,
					fontWeight: 'bold',
					color: theme.color,
				}}>
					{_(title)}
				</h3>
				<i className={`icon ${collapsed ? 'icon-chevron-right' : 'icon-chevron-down'}`}
					style={{ marginLeft: 'auto' }} />
			</div>
		);
	};

	const renderSyncButton = () => {
		const isSyncing = props.syncStarted;
		const label = isSyncing ? _('Cancel sync') : _('Sync now');
		const iconName = isSyncing ? 'icon-sync' : 'icon-sync';

		return (
			<StyledSynchronizeButton
				level={ButtonLevel.SidebarSecondary}
				iconName={iconName}
				iconAnimation={isSyncing ? 'icon-infinite-rotation 1s linear infinite' : ''}
				title={isSyncing ? _('Click to cancel synchronization') : _('Start synchronization')}
				aria-label={label}
				onClick={() => CommandService.instance().execute('synchronize', isSyncing)}
				style={{
					marginTop: theme.mainPadding,
					backgroundColor: isSyncing ? theme.backgroundColorHover3 : 'transparent',
					transition: 'background-color 0.3s ease',
				}}
			/>
		);
	};

	const statusMessages = [
		...(Synchronizer.reportToLines(props.syncReport)),
		props.resourceFetcher?.toFetchCount
			? [_('Fetching resources: %d/%d', props.resourceFetcher.fetchingCount, props.resourceFetcher.toFetchCount)]
			: [],
		props.decryptionWorker?.state !== 'idle' && props.decryptionWorker?.itemCount
			? [_('Decrypting items: %d/%d', props.decryptionWorker.itemIndex + 1, props.decryptionWorker.itemCount)]
			: [],
	];

	return (
		<StyledRoot 
			className="sidebar _scrollbar2" 
			role="navigation" 
			aria-label={_('Sidebar')}
			style={{ 
				display: 'flex', 
				flexDirection: 'column',
				gap: theme.mainPadding,
			}}
		>
			{/* Folders Section */}
			<div role="region" aria-labelledby="folders-heading">
				{renderSectionHeader('Folders', foldersCollapsed, () => setFoldersCollapsed(!foldersCollapsed))}
				{!foldersCollapsed && (
					<FolderAndTagList 
						type="folder" 
						style={{ paddingLeft: theme.mainPadding }}
						role="list"
						tabIndex={-1}
						id="folders-list"
						data-testid="folders-list"
					/>
				)}
			</div>

			{/* Tags Section */}
			<div role="region" aria-labelledby="tags-heading">
				{renderSectionHeader('Tags', tagsCollapsed, () => setTagsCollapsed(!tagsCollapsed))}
				{!tagsCollapsed && (
					<FolderAndTagList 
						type="tag" 
						style={{ paddingLeft: theme.mainPadding }}
						role="list"
						tabIndex={-1}
						id="tags-list"
						data-testid="tags-list"
					/>
				)}
			</div>

			{/* Sync Section */}
			<div 
				className="sync-section"
				style={{ 
					padding: theme.mainPadding,
					borderTop: `1px solid ${theme.dividerColor}`,
					backgroundColor: theme.backgroundColor2,
				}}
				role="region" 
				tabIndex={0}
				title={_('Synchronization status')}
		 >
			  {statusMessages.length > 0 && (
				  <StyledSyncReport>
					  {statusMessages.map((line, index) => (
						  <StyledSyncReportText 
							  key={index}
							  style={{
								  fontSize: theme.fontSizeSmall,
								  color: theme.colorFaded,
								  lineHeight: '1.4'
							  }}
						  >
							  {line}
						  </StyledSyncReportText>
					  ))}
				  </StyledSyncReport>
			  )}
			  {renderSyncButton()}
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
	collapsedFolderIds: state.collapsedFolderIds,
	decryptionWorker: state.decryptionWorker,
	resourceFetcher: state.resourceFetcher,
});

export default connect(mapStateToProps)(SidebarComponent);



