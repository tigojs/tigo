# @tigojs/faas-log

Add log service for `@tigojs/faas`, allow to record logs inside the lambda.

## Usage

Use `@tigojs/cli` to install.

```bash
tigo add faas-log
```

## Configuration

Here's a template:

```js
module.exports = {
  plugins: {
    faasLog: {
      package: '@tigojs/faas-log',
      config: {
        mongoEngine: '',  // specific a mongodb engine, optional
      },
    },
  },
};
```

## License

MIT
