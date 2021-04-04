class Response {
  constructor ({ status, body, headers }) {
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

module.exports = Response;
