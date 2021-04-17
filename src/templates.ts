import * as vscode from 'vscode';
import * as fs from 'fs';

export function getFileMaker(reference: vscode.TextDocument): NewFileMaker {
    const ctor = findTemplateForLanguage(reference.languageId);
    return new ctor(reference);
}

function findTemplateForLanguage(languageId: string): typeof NewFileMaker {
    switch (languageId) {
        case 'go':
            return GoFileMaker;
        case 'php':
            return naiveFileMaker('<?php\n\n');
        case 'java':
            return JavaFileMaker;
        case 'shellscript':
            return ShellscriptFileMaker;
    }

    return EmptyFileMaker;
}

export class NewFileMaker {
    protected makeExecutable = false;

    body: string = '';
    selection: vscode.Selection = new vscode.Selection(999, 0, 999, 0);

    constructor(protected reference: vscode.TextDocument) { }

    updateContent(newFileName: string) {
        this.updateContentByLanguage(newFileName);
        this.handleHashbang();
    }

    updateContentByLanguage(newFileName: string): void { }

    handleHashbang() {
        const line = this.reference.lineAt(0).text;
        if (!line.startsWith('#!')) {
            return;
        }

        this.body = line + '\n' + this.body;
        this.makeExecutable = true;

        this.translateSelection(1);

    }

    async postProcess(document: vscode.TextDocument) {
        if (this.makeExecutable) {
            const stat = await fs.promises.stat(document.fileName);
            const newMode = stat.mode | fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH;
            await fs.promises.chmod(document.fileName, newMode);
        }
    }

    translateSelection(lineChange: number) {
        const anchor = this.selection.anchor.translate(lineChange);
        const active = this.selection.active.translate(lineChange);
        this.selection = new vscode.Selection(anchor, active);
    }

}

class EmptyFileMaker extends NewFileMaker { }

function naiveFileMaker(content: string): typeof NewFileMaker {
    class Maker extends NewFileMaker {
        updateContentByLanguage(_: string): void {
            this.body = content;
        }
    }
    return Maker;
}


function getPackageDeclaration(keyword: string, reference: vscode.TextDocument): string {
    for (var i = 0; i < reference.lineCount; i++) {
        const line = reference.lineAt(i).text.trim();
        if (line.startsWith(keyword)) {
            return line + '\n\n';
        }
    }
    return '';
}

class GoFileMaker extends NewFileMaker {
    updateContentByLanguage(_: string): void {
        const packageLine = getPackageDeclaration('package', this.reference) || 'package main\n\n';

        var buildConstraints = '';
        for (var i = 0; i < this.reference.lineCount; i++) {
            const line = this.reference.lineAt(i).text.trim();
            if (/^\/\/\s*\+build/.test(line)) {
                buildConstraints += line + '\n';
            } else if (line.startsWith('//') || line.length === 0) {
                continue;
            } else {
                break;
            }
        }

        if (buildConstraints) {
            buildConstraints += '\n';
        }

        this.body = buildConstraints + packageLine;
    }
}

class JavaFileMaker extends NewFileMaker {
    updateContentByLanguage(newFileName: string): void {
        const packageLine = getPackageDeclaration('package', this.reference);

        const className = newFileName.slice(0, -5);
        this.body = packageLine + 'public class ' + className + ' {\n\n}';

        const lineCount = this.body.split('\n').length;
        this.selection = new vscode.Selection(lineCount - 2, 0, lineCount - 2, 0);
    }
}

// This one copies over `set` statements from the top of the file, which effect the
// behavior of the interpreter.
// The base class handles interpreter selection (`#!`).
class ShellscriptFileMaker extends NewFileMaker {
    updateContentByLanguage(_: string): void {
        var body = "";
        for (var i = 0; i < this.reference.lineCount; i++) {
            const line = this.reference.lineAt(i).text.trim();
            if (line.startsWith('#') || line.length === 0) {
                continue;
            }
            if (line.startsWith('set ')) {
                body += line + '\n';
                continue;
            }
            break;
        }

        this.body = body + '\n';
    }
}
