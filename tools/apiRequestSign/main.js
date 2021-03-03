const randomString = require('random-string');
const crypto = require('crypto');

class Signer {
  constructor({ ak, sk, accessKey, secretKey }) {
    this.ak = accessKey || ak;
    this.sk = secretKey || sk;
  }
  getHeaders() {
    const random = randomString({ length: 16 });
    const timestamp = new Date().valueOf();
    const toSign = `${random}${timestamp}${sk}`;
    const sign = crypto.createHmac(toSign, 'tigo').update(toSign).digest('hex');
    return {
      Authorization: `tigo_ak ${this.ak}`,
      'x-tigo-random': random,
      'x-tigo-timestamp': timestamp,
      'x-tigo-sign': sign,
    };
  }
}

module.exports = Signer;
