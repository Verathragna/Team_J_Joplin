import * as React from 'react';

export type EditorCommandsDependencies = {
	setShowRevisions: React.Dispatch<React.SetStateAction<boolean>>;
	isInFocusedDocument: ()=> boolean;
};
