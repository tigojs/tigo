# @tigojs/lambda-cors

Add cors support for tigo lambda.

This package is actually a wrapper of @koa/cors, see documentation of it to get more details of options.

## Example

```js
const cors = require('@tigojs/lambda-cors');

async function handleRequest(ctx) {
  // if you use an async function or the return of function is a promise, you should add an await before the cors(ctx);
  cors(ctx);
};

module.exports = handleRequest;
```
