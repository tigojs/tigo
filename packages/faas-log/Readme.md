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
        maxTimeSpan: 1000 * 60 * 60 * 24, // max time span for querying logs, default 1 day
        maxKeepDays: 7,  // optional, set the max days to keep the log
      },
    },
  },
};
```

## License

MIT
