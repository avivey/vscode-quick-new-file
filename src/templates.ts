import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import * as utils from './utils';

const HASHBANG = '#!';

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
            return shellscriptFileMaker;
        case 'python':
            return pythonFileMaker;
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
        if (!line.startsWith(HASHBANG)) {
            return;
        }

        this.body = line + '\n\n' + this.body;
        this.makeExecutable = true;

        this.translateSelection(2);
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

    /**
     * Lines are all trimmed of whitespace before examining.
     * After that:
     * - if any `commentMarkers` matches the start of the line, the line is ignored.
     * - if `importRegex' matches the line, it's an import line.
     *
     * Import lines and empty lines between import lines are copied over.
     * Comment lines are not copied.
     * Any other line will stop the import section.
     *
     * Non-comment syntax that precedes the import section - such as `use` or `package`
     * should be added to the "comment" section.
     */
    getImportsSection(
        importRegex: RegExp,
        commentMarkers: string[],
        multilineCommentMarkers: [string, string][]): string[] {

        var imports: string[] = [];
        var inImportSection = false;

        commentMarkers.push('#!');
        const isComment = function (text: string): Boolean {
            for (var j = 0; j < commentMarkers.length; j++) {
                if (text.startsWith(commentMarkers[j])) {
                    return true;
                }
            }
            return false;
        };

        /**
         * @returns comment ending symbol if this line starts a multi-line comment;
         *          `false` if this is isn't a start of a multi-line comment.
         */
        const isMultilineComment = function (text: string) {
            for (var j = 0; j < multilineCommentMarkers.length; j++) {
                if (text.startsWith(multilineCommentMarkers[j][0])) {
                    return multilineCommentMarkers[j][1];
                }
            }
            return false;
        };

        main_loop:
        for (var i = 0; i < this.reference.lineCount; i++) {
            const line = this.reference.lineAt(i).text.trim();

            if (isComment(line)) {
                continue;
            }

            const multilineCommentTerminator = isMultilineComment(line);
            if (multilineCommentTerminator) {
                // seek to end of comment...
                while (i < this.reference.lineCount - 1) {
                    i++;
                    const line = this.reference.lineAt(i).text;
                    if (line.includes(multilineCommentTerminator)) {
                        continue main_loop;
                    }
                }
            }

            if (line.length === 0) {
                if (inImportSection) {
                    imports.push(line);
                }
                continue;
            }

            if (importRegex.test(line)) {
                inImportSection = true;
                imports.push(line);
                continue;
            }

            // First non-import line
            inImportSection = false;
            break;
        }

        imports.push('');

        return imports;
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


/**
 * File maker for languages that require no boilerplate - only "imports" are copied.
 */
 function simpleFileMaker(
    importRegex: RegExp,
    commentMarkers: string[],
    multilineCommentMarkers: [string, string][]): typeof NewFileMaker {

    class Maker extends NewFileMaker {
        updateContentByLanguage(_content: string): void {
            const imports = this.getImportsSection(importRegex, commentMarkers, multilineCommentMarkers);

            var text = utils.dedupStringArray(imports);
            this.body = text.join('\n') + '\n';
        }
    }
    return Maker;
}


function getPackageDeclaration(keyword: string, reference: vscode.TextDocument): string[] {
    for (var i = 0; i < reference.lineCount; i++) {
        const line = reference.lineAt(i).text.trim();
        if (line.startsWith(keyword)) {
            return [line, ''];
        }
    }
    return [];
}

class GoFileMaker extends NewFileMaker {
    updateContentByLanguage(_: string): void {
        const packageLine = getPackageDeclaration('package', this.reference) || ['package main', ''];
        const imports = this.getImports();

        var buildConstraints: string[] = [];
        for (var i = 0; i < this.reference.lineCount; i++) {
            const line = this.reference.lineAt(i).text.trim();
            if (/^\/\/\s*\+build/.test(line)) {
                buildConstraints.push(line);
            } else if (line.startsWith(HASHBANG) || line.startsWith('//') || line.length === 0) {
                continue;
            } else {
                break;
            }
        }
        if (buildConstraints.length) {
            buildConstraints.push('');
        }
        var text: string[] = [];
        text = text.concat(buildConstraints, packageLine, imports);
        this.body = utils.dedupStringArray(text).join('\n') + '\n';
    }

    getImports(): string[] {
        var imports: string[] = [];
        var inImportSection = false;

        for (var i = 0; i < this.reference.lineCount; i++) {
            const line = this.reference.lineAt(i).text.trim();
            if (line.startsWith(HASHBANG) || line.startsWith('//') || line.startsWith('package')) {
                continue;
            }
            if (line.length === 0) {
                if (inImportSection) {
                    imports.push(line);
                }
                continue;
            }

            if (/^import\s*\(.*\)/.test(line)) {
                inImportSection = true;
                imports.push(line);
            } else if (/^import\s*\(/.test(line)) {
                // import list
                inImportSection = true;
                imports.push(line);
                while (i < this.reference.lineCount - 1) {
                    i++;
                    const line = this.reference.lineAt(i).text;
                    imports.push(line);
                    if (/\)/.test(line)) {
                        break;
                    }
                }
            } else if (line.startsWith('import')) {
                inImportSection = true;
                imports.push(line);
            } else {
                // First non-import line
                inImportSection = false;
                break;
            }
        }

        imports.push('');

        return imports;
    }
}

class JavaFileMaker extends NewFileMaker {
    updateContentByLanguage(newFileName: string): void {
        const packageLine = getPackageDeclaration('package', this.reference);

        // Is there a simpler way to get the name w/o extension?
        const className = path.basename(newFileName, path.extname(newFileName));

        const imports = this.getImportsSection(
            /^import\s/,
            ['//', 'package'],
            [['/*', '*/']]);
        const classBoilerplate = ['public class ' + className + ' {', '', '}'];

        var text: string[] = [];
        text = text.concat(packageLine, imports, classBoilerplate);
        text = utils.dedupStringArray(text);
        this.body = text.join('\n').trim() + '\n';

        const lineCount = text.length;
        this.selection = new vscode.Selection(lineCount - 2, 0, lineCount - 2, 0);
    }
}

/**
 *  For shell, `set` statements effect the behavior of the interpreter; `source` statements are effectively imports.
 *  The base class handles interpreter selection (`#!`).
 */
const shellscriptFileMaker = simpleFileMaker(/^set|^\. |^source\s/, ['#'], []);
const pythonFileMaker = simpleFileMaker(
    /^from\s.*import\s|^import\s/,
    ['#'],
    [["'''", "'''"], ['"""', '"""']]);
