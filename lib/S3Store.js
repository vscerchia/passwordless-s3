const crypto = require('crypto');
const S3 = require('aws-sdk/clients/s3');
const TokenStore = require('passwordless-tokenstore');

class S3Store extends TokenStore {
    constructor(s3Options = {}) {
        super();

        if (!s3Options.params || !s3Options.params.Bucket) {
            throw new Error('A bucket name must be provided');
        }

        this._s3Client = new S3(s3Options);

        this.authenticate = this.authenticate.bind(this);
        this.storeOrUpdate = this.storeOrUpdate.bind(this);
        this.invalidateUser = this.invalidateUser.bind(this);
        this.clear = this.clear.bind(this);
        this.length = this.length.bind(this);
        this._createHash = this._createHash.bind(this);
    }

    /**
     * Checks if the provided token / user id combination exists and is
     * valid in terms of time-to-live. If yes, the method provides the
     * the stored referrer URL if any.
     * @param  {String}   token to be authenticated
     * @param  {String}   uid Unique identifier of an user
     * @param  {Function} callback in the format (error, valid, referrer).
     * In case of error, error will provide details, valid will be false and
     * referrer will be null. If the token / uid combination was not found
     * found, valid will be false and all else null. Otherwise, valid will
     * be true, referrer will (if provided when the token was stored) the
     * original URL requested and error will be null.
    */
    authenticate(token, uid, callback) {
        if(!token || !uid || !callback) {
            throw new Error('TokenStore:authenticate called with invalid parameters');
        }
        const params = {
            Key: this._createHash(uid)
        };

        this._s3Client.getObject(params, (err, data) => {
            if (err) {
                if (err.code === 'NoSuchKey') {
                    callback(null, false, null);
                }
                else {
                    callback(err, false, null);
                }
            }
            else {
                const { hashedToken, originUrl, ttl } = JSON.parse(data.Body.toString());
                if (Date.now() > ttl) {
                    this.invalidateUser(uid, () => {});
                    callback(null, false, null);
                }
                if (this._createHash(token) !== hashedToken) {
                    callback(err, false, null);
                }
                else {
                    callback(null, true, originUrl || "");
                }
            }
        });
    }

    /**
     * Stores a new token / user ID combination or updates the token of an
     * existing user ID if that ID already exists. Hence, a user can only
     * have one valid token at a time
     * @param  {String}   token Token that allows authentication of _uid_
     * @param  {String}   uid Unique identifier of an user
     * @param  {Number}   msToLive Validity of the token in ms
     * @param  {String}   originUrl Originally requested URL or null
     * @param  {Function} callback Called with callback(error) in case of an
     * error or as callback() if the token was successully stored / updated
     */
    storeOrUpdate(token, uid, msToLive, originUrl, callback) {
        if (!token || !uid || !msToLive || !callback) {
            throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
        }
        const newObject = JSON.stringify({
            hashedToken: this._createHash(token),
            uid: uid,
            ttl: Date.now() + msToLive,
            originUrl: originUrl
        });
        const params = {
            Body: newObject,
            Key: this._createHash(uid)
        };
        this._s3Client.putObject(params, (err, data) => {
            if (err) {
                callback(err);
            }
            else {
                callback();
            }
        });
    }

    /**
     * Invalidates and removes a user and the linked token
     * @param  {String}   user ID
     * @param  {Function} callback called with callback(error) in case of an
     * error or as callback() if the uid was successully invalidated
     */
    invalidateUser(uid, callback) {
        if (!uid || !callback) {
            throw new Error('TokenStore:invalidateUser called with invalid parameters');
        }
        const params = {
            Key: this._createHash(uid)
        };
        this._s3Client.deleteObject(params, (err, data) => {
            if (err) {
                callback(err);
            }
            else {
                callback();
            }
        });
    }

    /**
     * Removes and invalidates all token
     * @param  {Function} callback Called with callback(error) in case of an
     * error or as callback() if the token was successully stored / updated
     */
    clear(callback) {
        if (!callback) {
            throw new Error('TokenStore:clear called with invalid parameters');
        }
        this._s3Client.listObjects({}, (err, data) => {
            if (err) {
                callback(err);
            }
            else if (data.Contents.length === 0) {
                callback();
            }
            else {
                const params = {Delete: {Objects: []}};
                data.Contents.forEach((content) => {
                    params.Delete.Objects.push({Key: content.Key});
                });
                this._s3Client.deleteObjects(params, (err, data) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (data.Deleted.length === 1000) {
                            _emptyBucket(callback)
                        }
                        else {
                            callback();
                        }
                    }
                });
            }
        });
    }

    /**
     * Number of tokens stored (no matter the validity)
     * @param  {Function} callback Called with callback(null, count) in case
     * of success or with callback(error) in case of an error
     */
    length(callback) {
        let allMetadata = [];

        const listAllKeys = (marker, callback) => {
            const params = {};
            if (marker) {
                params.Marker = marker;
            }
            this._s3Client.listObjects(params, (err, data) => {
                if (err) {
                    callback(err);
                }
                else {
                    allMetadata = allMetadata.concat(data.Contents);
                    if (data.IsTruncated) {
                        const nextMarker = data.NextMarker || data.Contents[data.Contents.length-1].Key;
                        listAllKeys(nextMarker, callback);
                    }
                    else {
                        callback(null, allMetadata.length);
                    }
                }
            });
        };

        listAllKeys(null, callback);
    }

    _createHash(token) {
        return crypto.createHash('md5').update(token).digest('hex');
    }
}

module.exports = S3Store;
