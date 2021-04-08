class Response {
  constructor (response) {
    const { status, body, headers } = response;
    if (!status || !body || !headers) {
      this.status = 200;
      this.body = response;
      this.headers = {};
    }
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

module.exports = Response;
