const expect = require('chai').expect;
const standardTests = require('passwordless-tokenstore-test');
const S3Store = require('../lib/S3Store');

const testBucket = 'commercehub-pstr-vinny-passwordless';
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

describe('Your specific tests', function () {

	beforeEach((done) => {
        beforeEachTest(done);
	});

	afterEach(function(done) {
		afterEachTest(done);
	});
});
