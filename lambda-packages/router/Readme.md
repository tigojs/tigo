# @tigojs/lambda-router

This is a router helper for tigo lambda users, based on [koa-tree-router](https://github.com/steambap/koa-tree-router).

## Usage

Firstly, you should add it to the server via `npm install`.

Then you can use it like this in your lambda:

```js
const { createRouter } = require('@tigojs/lambda-router');

const router = createRouter();

// your function
async function myBusinessFunction(ctx, next) {
  // your code
}

// path is the relative path to your router.
router.get('/route');

async function handleRequest(ctx) {
  // MUST HAVE THIS LINE, OHTERWISE THE ROUTER WILL NOT WORK!
  router.route(ctx);
  // AND ALSO, YOU SHOULD REGISTER ALL YOUR ROUTES BEFORE YOU CALL THIS FUNCTION.
}

module.exports = handleRequest;
```

## License

MIT
