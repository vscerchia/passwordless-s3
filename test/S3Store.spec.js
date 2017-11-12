const expect = require('chai').expect;
const standardTests = require('passwordless-tokenstore-test');
const S3Store = require('../lib/S3Store');

const testBucket = '';
if (!testBucket) {
	throw new Error('A test bucket must be specified.');
}
function TokenStoreFactory() {
	return new S3Store({params: {Bucket: testBucket}});
}

const beforeEachTest = function (done) {
	done();
}

const afterEachTest = function (done) {
	done();
}

standardTests(TokenStoreFactory, beforeEachTest, afterEachTest, 1000);
