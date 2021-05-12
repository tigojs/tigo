declare module '@tigojs/api-sign' {
  interface SignedHeaders {
    Authorization: string;
    'x-tigo-random': string;
    'x-tigo-timestamp': number;
    'x-tigo-sign': string;
  }

  class Signer {
    constructor({ ak, sk, accessKey, secretKey }: { ak?: string; sk?: string; accessKey?: string; secretKey?: string });
    getHeaders(): SignedHeaders;
  }

  export = Signer;
}
