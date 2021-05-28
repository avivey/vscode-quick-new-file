import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import * as stubs from './stubs'; // TODO move stuff to __mocks__

import * as templates from '../templates';

// TODO missing tests:
// Selection location
// hashbang/chmod +x

interface TestCase {
    language: string,
    sourceFile: string,
    targetFile: string,
    targetFilename?: string,
};

/*
test file looks like this:

title
free text
more free text
:: language id
body of source file
:: new file name (optional)
body of new file
::
EOF

*/
async function parseFile(filename: string): Promise<TestCase> {
    const body: string = await fs.promises.readFile(filename, { encoding: 'utf8' });
    const content = body.split(/\n|\r\n/);


    let phase: 'header' | 'source' | 'target' | 'done' = 'header';

    let language = '';
    let source = '';
    let target = '';

    for (let i = 0; i < content.length; i++) {
        const line = content[i];
        const isBorder = line.trimLeft().startsWith('::');
        switch (phase) {
            case 'header':
                if (isBorder) {
                    language = line.substr(3).trim();
                    phase = 'source';
                    break;
                }
                // ignore rest of header for now
                break;
            case 'source':
                if (isBorder) {
                    // TODO read filename
                    phase = 'target';
                    break;
                }
                source += line;
                source += '\n';

                break;
            case 'target':
                if (isBorder) {
                    phase = 'done';
                    break;
                }
                target += line;
                target += '\n';

                break;
            case 'done':
                break;
        }
    }

    return { language, sourceFile: source, targetFile: target };
}


function testExecution(testCase: TestCase) {
    jest.mock('fs'); // I wonder if this does what I think it does.

    const reference = new stubs.TextDocument();
    reference.languageId = testCase.language;

    reference.setBody(testCase.sourceFile);

    const maker = templates.getFileMaker(reference);

    maker.updateContent(testCase.targetFilename || 'newfilename.ext');

    assert.strictEqual(maker.body, testCase.targetFile);
}

const testsRoot = __dirname;
const ALL_TEST_FILES = glob.sync('**/*.test', { cwd: testsRoot });

test.each(ALL_TEST_FILES)("Run test file %s", async filename => {
    const testData = await parseFile(path.join(testsRoot, filename));

    testExecution(testData);
});


test('Parse a test file', async () => {
    const testData = await parseFile(path.join(testsRoot, 'simple-go-file.test'));

    assert.strictEqual(testData.language, 'go');
    assert.strictEqual(testData.sourceFile, 'package one\n\nfunc moo() {}\n');
    assert.strictEqual(testData.targetFile, 'package one\n\n');
});
