// mocks/stubs for vscode types.

export class Position {
    line: number;
    character: number;

    constructor(line: number, character: number) {
        this.line=line;
        this.character=character;
    }

    // isBefore(other: Position): boolean;
    // isBeforeOrEqual(other: Position): boolean;
    // isAfter(other: Position): boolean;
    // isAfterOrEqual(other: Position): boolean;
    // isEqual(other: Position): boolean;
    // compareTo(other: Position): number;
    // translate(lineDelta?: number, characterDelta?: number): Position;
    // translate(change: { lineDelta?: number; characterDelta?: number; }): Position;
    // with(line?: number, character?: number): Position;
    // with(change: { line?: number; character?: number; }): Position;
}

export class Range {
    start: Position;
    end: Position;

    constructor(start: Position, end: Position) {
        this.start = start;
        this.end = end;
    }

    // constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
    // isSingleLine: boolean;
    // contains(positionOrRange: Position | Range): boolean;
    // isEqual(other: Range): boolean;
    // intersection(range: Range): Range | undefined;
    // union(other: Range): Range;
    // with(start?: Position, end?: Position): Range;
    // with(change: { start?: Position, end?: Position }): Range;
}

export class Selection extends Range {
    constructor(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number) {
        super(new Position(anchorLine, anchorCharacter), new Position(activeLine, activeCharacter));
    }

    /**
     * A selection is reversed if [active](#Selection.active).isBefore([anchor](#Selection.anchor)).
     */
    // isReversed: boolean;
}


export class Uri {
    scheme: string = "file";
    authority: string = '';
    path: string = '/home/user/file.txt';
    query: string = '';
    fragment: string = '';
    fsPath: string = '';

    static file(path: string): Uri {
        const uri = new Uri();
        uri.scheme = 'file';
        uri.path = path;
        uri.fsPath = path;
        return uri;
    }

    // with(change: {
    //     scheme?: string | undefined;
    //     authority?: string | undefined;
    //     path?: string | undefined;
    //     query?: string | undefined;
    //     fragment?: string | undefined;
    // }): Uri ;
}

export enum EndOfLine {
    LF = 1,
    CRLF = 2
}
