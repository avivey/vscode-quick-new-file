// These are tests to check the stubs.

import * as assert from 'assert';
import * as stubs from './stubs';

test('Test TextDocument', () => {
	const doc = new stubs.TextDocument();
	doc.languageId = 'shellscript';

	doc.setBody(`
	set -e
	set +x

	code
	# "set" command after code should not be copied over.
	set -e
	`);

    assert.strictEqual(doc.lineCount, 8);
    assert.strictEqual(doc.lineAt(4).text.trim(), 'code');
});
