import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { _ } from '../locale';
import { saveTokens } from '../SyncTargetJoplinServerSAML';

export const declaration: CommandDeclaration = {
	name: 'samlLogin',
	label: () => _('Login to Joplin Server using SAML'),
	iconName: 'fa-right-to-bracket',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext, id: string, user_id: string) => {
			saveTokens(id, user_id);
		},
	};
};
