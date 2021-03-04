import jsonwebtoken from 'jsonwebtoken';

interface ExpiresOptions {
  access?: string;
  refresh?: string;
}

interface JWTOptions {
  secret: string;
  expires?: ExpiresOptions;
}

class JWT {
  secret: string;
  expires: ExpiresOptions;
  constructor(opts: JWTOptions) {
    if (!opts.secret) {
      throw new Error('You should provide secret to sign token.');
    }
    this.secret = opts.secret;
    opts.expires = opts.expires || {};
    this.expires = {
      access: opts.expires.access || '2h',
      refresh: opts.expires.refresh || '7d',
    };
  }
  create(userInfo: object) {
    const accessToken = jsonwebtoken.sign(
      {
        ...userInfo,
        tokenType: 'access',
      },
      this.secret,
      {
        expiresIn: this.expires.access,
      }
    );
    const refreshToken = jsonwebtoken.sign(
      {
        ...userInfo,
        totkenType: 'refresh',
      },
      this.secret,
      {
        expiresIn: this.expires.refresh,
      }
    );
    return { accessToken, refreshToken };
  }
  verify(token: string) {
    return new Promise((resolve, reject) => {
      jsonwebtoken.verify(token, this.secret, (err, decoded) => {
        if (err) {
          reject(err);
        }
        resolve(decoded);
      });
    });
  }
}

export default JWT;
