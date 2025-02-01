import { CommandRuntime, CommandDeclaration } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import { focus } from '@joplin/lib/utils/focusHandler';
import { EditorCommandsDependencies } from '../types';

export const declaration: CommandDeclaration = {
	name: 'focusToolbar',
	label: () => _('Toolbar'),
	parentLabel: () => _('Focus'),
};

export const runtime = (dependencies: EditorCommandsDependencies): CommandRuntime => {
	return {
		execute: async () => {
			if (!dependencies || !dependencies.editorContainerDomElement) return;

			const boldOnRTE = dependencies.editorContainerDomElement.querySelector(
				'.tox-tbtn[title=\'Bold\']',
			);

			if (boldOnRTE) {
				focus('focusToolbarCommand', boldOnRTE);
				return;
			}

			const boldOnMarkdown = dependencies.editorContainerDomElement.querySelector(
				'.button.toolbar-button[title=\'Bold\']',
			);

			if (boldOnMarkdown) {
				focus('focusToolbarCommand', boldOnMarkdown);
			}

		},
	};
};
