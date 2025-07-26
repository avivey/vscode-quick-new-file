// Stuff in this file doesn't count as "mocks" because it's just classes that implements interfaces from vscode.
// It uses mocked stuff though.
import * as vscode from 'vscode';

export class TextDocument implements vscode.TextDocument {
    encoding: string = 'utf-8';
    uri: vscode.Uri = vscode.Uri.file("c:\\foo.bar");
    fileName: string = 'file';
    isUntitled: boolean = false;
    languageId: string = "text";
    version: number = 2;
    isDirty: boolean = false;
    isClosed: boolean = false;
    eol: vscode.EndOfLine = vscode.EndOfLine.LF;
    lineCount: number = 1;

    body: string[] = [''];

    setBody(body: string) {
        this.body = body.split(/\n|\r\n/);
        this.lineCount = this.body.length;
    }

    save(): Thenable<boolean> {
        throw new Error('Method not implemented.');
    }

    lineAt(line: number): vscode.TextLine;
    lineAt(position: vscode.Position): vscode.TextLine;
    lineAt(arg: any): vscode.TextLine {

        if (typeof arg === "number") {
            return new TextLine(this.body[arg], new vscode.Range(arg, 0, arg, 9999)); // WRONG a bit
        }

        throw new Error('Method not implemented.');
    }
    offsetAt(position: vscode.Position): number {
        throw new Error('Method not implemented.');
    }
    positionAt(offset: number): vscode.Position {
        throw new Error('Method not implemented.');
    }
    getText(range?: vscode.Range): string {
        throw new Error('Method not implemented.');
    }
    getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined {
        throw new Error('Method not implemented.');
    }
    validateRange(range: vscode.Range): vscode.Range {
        throw new Error('Method not implemented.');
    }
    validatePosition(position: vscode.Position): vscode.Position {
        throw new Error('Method not implemented.');
    }

}


class TextLine implements vscode.TextLine {
    lineNumber: number;
    text: string;
    range: vscode.Range;
    rangeIncludingLineBreak: vscode.Range;
    firstNonWhitespaceCharacterIndex: number;
    isEmptyOrWhitespace: boolean;

    constructor(text: string, range: vscode.Range) {
        this.text = text;
        this.range = range;
        this.lineNumber = range.start.line;

        this.rangeIncludingLineBreak = range; // WRONG
        this.firstNonWhitespaceCharacterIndex = 0; // WRONG
        this.isEmptyOrWhitespace = false; // WRONG
    }

}
