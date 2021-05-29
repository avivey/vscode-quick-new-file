// Test some utility functions
import * as assert from 'assert';
import * as utils from '../utils';

test('dedup string array', () => {

    var x = ['a', 'b', 'c', '', '', '', 'e', 'e', ''];
    const want = ['a', 'b', 'c', '', 'e', ''];

    const have = utils.dedupStringArray(x);

    assert.strictEqual(have.join(), want.join());
});
