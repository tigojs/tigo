# @tigojs/mongodb

Provide mongodb support for `tigo`.

## Usage

We recommend to use `@tigojs/cli` to add this package.

```bash
tigo add mongodb
```

After installing, you can get this mongodb engine by `app.dbEngine.mongodb.tmongo`.

## Configuration

Here's a template:

```js
// .tigorc.js
module.exports = {
  plugins: {
    mongodb: {
      package: '@tigojs/mongodb',
      config: {
        uri: 'YOUR_CONNECTION_URL',
      },
    },
  },
};
```

## License

MIT
