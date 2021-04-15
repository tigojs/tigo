const { getAgent } = require('@tigojs/api-request');
const Parameter = require('parameter');
const { optionRules, putObjectRules, removeObjectRules, getObjectRules } = require('./constants/rules');
const { buildInvalidMessage } = require('./utils/error');

const parameter = new Parameter();

class OSSClient {
  /**
   * Create a tigo oss client.
   * @param {Object} opts - Options
   * @param {string} opts.host - The host of API server.
   * @param {number} opts.port - Not necessary if port is 80 or 443.
   * @param {boolean} opts.https - If true, using https to request API.
   * @param {string} opts.base - Base path of API, like /api, not necessary.
   * @param {string} opts.accessKey - Your tigo API AccessKey.
   * @param {string} opts.secretKey - Your tigo API SecertKey.
   * @param {number} opts.timeout - Timeout for requests, will not be effected on uploading files.
   */
  constructor(opts) {
    const optErrs = parameter(optionRules, opts);
    if (!optErrs) {
      throw new Error(buildInvalidMessage(optErrs));
    }
    this.opts = opts;
    const { host, port, https, base, accessKey, secretKey, timeout } = opts;
    this.timeout = {
      request: timeout || 5000,
    };
    // get agent
    this.request = getAgent({
      host,
      port: port || (https ? 443 : 80),
      base: base || '',
      ak: accessKey,
      sk: secretKey,
    });
  }
  /**
   * @param {string} bucketName Name of bucket
   * @returns {Promise<boolean>} exists
   */
  async bucketExists(bucketName) {
    if (!bucketName) {
      throw new Error('bucketName is required.');
    }
    const res = await this.request.get('/oss/bucketExists').query({ bucketName });
    return res.body.data?.exists ?? false;
  }
  /**
   * @param {Object} args
   * @param {string} args.bucketName Name of bucket
   * @param {string} args.key Key of file
   * @param {WritableStream} args.output A stream can write file data
   * @returns {void} Nothing will be returned
   */
  getObject(args) {
    const { bucketName, key, output } = args;
    const errs = parameter(getObjectRules, args);
    if (errs) {
      throw new Error(buildInvalidMessage(errs));
    }
    if (!output) {
      throw new Error('Missing output.');
    }
    const req = this.request.get('/oss/getObject').query({
      bucketName,
      key,
    });
    req.pipe(output);
  }
  /**
   * @param {Object} args
   * @param {string} args.bucketName Name of bucket
   * @param {string} args.key Key of file
   * @param {string} args.file Path of file which will to be uploaded
   * @param {boolean} args.force Optional, force upload when file exists
   * @returns {Promise<void>} Nothing will be returned
   */
  async putObject(args) {
    const errs = parameter(putObjectRules, args);
    if (errs) {
      throw new Error(buildInvalidMessage(errs));
    }
    const { bucketName, key, file, force } = args;
    if (Buffer.isBuffer(file)) {
      const idx = key.lastIndexOf('/');
      const name = key.substr(idx + 1);
      await this.request
        .post('/oss/putObject')
        .field('bucketName', bucketName)
        .field('key', key)
        .field('force', force ?? false)
        .attach('file', file, name);
    } else if (typeof file === 'string') {
      await this.request
        .post('/oss/putObject')
        .field('bucketName', bucketName)
        .field('key', key)
        .field('force', force ?? false)
        .attach('file', file);
    } else {
      throw new Error('Type of file is unrecognized.');
    }
  }
  /**
   * @param {Object} args
   * @param {string} args.bucketName Name of bucket
   * @param {string} args.key Key of file
   * @returns {Promise<boolean>} If object be removed successfully
   */
  async removeObject(args) {
    const errs = parameter(removeObjectRules, args);
    if (errs) {
      throw new Error(buildInvalidMessage(errs));
    }
    const { bucketName, key } = args;
    const res = await this.request.post('/oss/deletObject').send({ bucketName, key });
    return res.body.data?.success ?? false;
  }
}

module.exports = OSSClient;
