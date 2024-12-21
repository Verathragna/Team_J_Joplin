import { EditorSelection } from '@codemirror/state';
import { toggleStrikethrough } from './markdownCommands';
import createTestEditor from '../testUtil/createTestEditor';

describe('strikethroughCommand', () => {
    jest.retryTimes(2);

    it('should toggle strikethrough formatting', async () => {
        const initialText = 'Test text';
        const editor = await createTestEditor(
            initialText,
            EditorSelection.range(0, initialText.length),
            []
        );

        // Apply strikethrough
        toggleStrikethrough(editor);
        expect(editor.state.doc.toString()).toBe('~~Test text~~');
        
        // Remove strikethrough
        toggleStrikethrough(editor);
        expect(editor.state.doc.toString()).toBe('Test text');
    });

    it('should handle empty selection', async () => {
        const editor = await createTestEditor(
            '',
            EditorSelection.cursor(0),
            []
        );

        toggleStrikethrough(editor);
        expect(editor.state.doc.toString()).toBe('~~~~');
        
        // Cursor should be between the tildes
        expect(editor.state.selection.main.from).toBe(2);
        expect(editor.state.selection.main.to).toBe(2);
    });

    it('should preserve strikethrough when splitting text', async () => {
        const editor = await createTestEditor(
            '~~text~~',
            EditorSelection.cursor(4),
            ['StrikeThrough']
        );

        editor.dispatch(editor.state.replaceSelection('\n'));
        expect(editor.state.doc.toString()).toBe('~~te\nxt~~');
    });
});