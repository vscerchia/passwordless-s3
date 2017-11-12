/* eslint-disable no-console */
const async = require('async');
const { expect } = require('chai');
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
};

const afterEachTest = function (done) {
    const store = TokenStoreFactory();
    store.clear((err) => {
        if (err) {
            console.warn('Unable to empty bucket after test.', err);
        }
        done();
    });
};

standardTests(TokenStoreFactory, beforeEachTest, afterEachTest, 1000);

describe('S3Store', function () {
    this.timeout(20000);

    beforeEach((done) => {
        beforeEachTest(done);
    });

    afterEach((done) => {
        afterEachTest(done);
    });

    describe('clear', () => {

        it('should clear bucket when there are more than 1000 tokens stored', (done) => {
            const numTokens = 1100;
            const store = TokenStoreFactory();

            let asyncTasks = [];
            for (let index = numTokens; index > 0; index--) {
                asyncTasks.push((callback) => {
                    store.storeOrUpdate(`token${index*100}`, `user${index}`, 10000, null, (err) => {
                        callback(err);
                    });
                });
            }

            async.parallelLimit(asyncTasks, 25, (err, results) => {
                expect(results.length).to.equal(numTokens);
                store.clear((err) => {
                    expect(err).to.not.exist;
                    store.length((err, length) => {
                        expect(err).to.not.exist;
                        expect(length).to.equal(0);
                        done();
                    });
                });
            });
        });
    });
});
