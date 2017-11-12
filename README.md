# Passwordless-S3
S3 token store for [Passwordless](https://github.com/florianheinemann/passwordless).

## Installation
* `npm install passwordless-s3 # TODO - module not yet published`

## Usage
The S3 bucket must exist prior to using this token store. Further, since the `S3Store` has the ability to empty the bucket, the bucket should not hold any files besides the ones put there by the `S3Store`.
```javascript
const S3Store = require('passwordless-s3');
passwordless.init(new S3Store({params: {Bucket: 'your-bucket-name'}}))
```
The constructor takes in `s3Options`, which is passed to the underlying S3 client. `params.Bucket` is the only required option. See [the aws-sdk docs for NodeJs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html) for a full description of the `options` object.

## Testing and linting
* `npm test`
* `npm run lint`
