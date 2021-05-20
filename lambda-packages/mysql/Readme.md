# @tigojs/lambda-mysql

Provide mysql connection ability for tigo lambda.

## Usage

Install by `npm` or `@tigojs/cli`.

```bash
npm install @tigojs/lambda-mysql
# or
tigo add lambda-mysql
```

Then in your lambda, you can connect to your mysql database like this:

```js
const mysql = require('@tigojs/mysql');

addEventListener('request', (event) => {
  // create connection
  const conn = mysql.createConnection({
    host: SCRIPT_ENV.host,  // we recommend to use environment KV to store your credential
    password: SCRIPT_ENV.password,
    database: SCRIPT_ENV.database,
  });
});
```

For more details, see [documentation](https://github.com/sidorares/node-mysql2/tree/master/documentation) of `mysql2`.

Note: this package is using `mysql2/promise`, not the default version.

## License

MIT
