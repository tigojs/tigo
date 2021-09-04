class Response {
  constructor (response) {
    const { status, body, headers, redirect } = response;
    this.status = status || 200;
    this.body = body || '';
    this.headers = headers || {};
    this.redirect = redirect || null;
  }
}

module.exports = Response;
