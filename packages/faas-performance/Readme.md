# @tigojs/faas-performance

Provide performance log support for tigo lambda.

## Usage

Install this plugin with `@tigojs/cli`:

```bash
tigo add faas-performance
```

## Configuration

Here's a template:

```js
// .tigorc.js
module.exports = {
  plugins: {
    faasPerm: {
      package: '@tigojs/faas-performance',
      config: {
        mongoEngine: '',  // specific a mongodb engine, optional
        database: '', // specific a database name, optional
        maxTimeSpan: 1000 * 60 * 60 * 24, // max time span for querying logs, default 1 day
        maxKeepDays: 7,  // optional, set the max days to keep the log
      },
    },
  },
};
```

## License

MIT
