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
				'.tox-toolbar__group button',
			);

			if (boldOnRTE) {
				focus('focusToolbarCommand', boldOnRTE);
				return;
			}

			const boldOnMarkdown = dependencies.editorContainerDomElement.querySelector(
				'#CodeMirrorToolbar div.group:nth-of-type(2) button.button.toolbar-button:nth-of-type(1)',
			);

			if (boldOnMarkdown) {
				focus('focusToolbarCommand', boldOnMarkdown);
			}

		},
	};
};
