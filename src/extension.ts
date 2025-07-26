import * as path from 'path';
import * as vscode from 'vscode';
import * as templates from './templates';

export function activate(context: vscode.ExtensionContext) {
	function d(disposable: vscode.Disposable) {
		context.subscriptions.push(disposable);
	}

	d(vscode.commands.registerTextEditorCommand('quick-new-file.new-file', async (activeEditor, edit) => {

		if (!activeEditor) {
			vscode.window.showErrorMessage("New file must be based on an existing file.");
			return;
		}

		const referenceFile = activeEditor.document;

		if (referenceFile.isUntitled) {
			vscode.window.showErrorMessage("Cannot create new file based on untitled file.");
			return;
		}

		const fileMaker = templates.getFileMaker(referenceFile);

		const extension = path.extname(referenceFile.fileName);

		function validateFilename(input: string) {
			if (/[\s\\/]/.test(input)) {
				return 'Invalid filename';
			}
			// TODO check for file exists
			return null;
		}

		const filename = await vscode.window.showInputBox({
			placeHolder: 'filename',
			prompt: 'Enter new filename.',
			validateInput: validateFilename,
			value: 'newfilename' + extension,
			valueSelection: [0, 'newfilename'.length],
		});

		if (filename === undefined) {
			return;
		}
		fileMaker.updateContent(filename);

		const editOps = new vscode.WorkspaceEdit();

		const newFilePath = path.dirname(referenceFile.uri.path) + '/' + filename;
		const uri = referenceFile.uri.with({ path: newFilePath });
		editOps.createFile(uri);

		const content = fileMaker.body;
		editOps.insert(uri, new vscode.Position(0, 0), content);


		if (!await vscode.workspace.applyEdit(editOps)) {
			vscode.window.showErrorMessage("Failed to create file.");
			return;
		}

		// TODO explicitly set language

		const newDoc = await vscode.workspace.openTextDocument(uri);
		const editor = await vscode.window.showTextDocument(newDoc);
		editor.selection = fileMaker.selection;

		await fileMaker.postProcess(newDoc);
		await newDoc.save();

	}));

}

export function deactivate() { }
