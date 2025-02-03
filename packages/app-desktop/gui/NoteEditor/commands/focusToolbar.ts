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

			const firstButtonOnRTEToolbar = dependencies.editorContainerDomElement.querySelector(
				'.tox-toolbar__group button',
			);

			if (firstButtonOnRTEToolbar) {
				focus('focusToolbarCommand', firstButtonOnRTEToolbar);
				return;
			}

			const firstButtonOnMarkdownToolbar = dependencies.editorContainerDomElement.querySelector(
				'#CodeMirrorToolbar .button[tabindex="0"]:not(.disabled)',
			);

			if (firstButtonOnMarkdownToolbar) {
				focus('focusToolbarCommand', firstButtonOnMarkdownToolbar);
			}

		},
	};
};
