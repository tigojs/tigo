# @tigojs/fepanel

Integrate the panel to your `tigo` server.

## Usage

If you hasn't installed `@tigojs/cli` before, you should install it to your server first:

```bash
npm install @tigojs/cli -g
```

Please ensure that `@tigojs/hostbinder` is installed, it's necessary.

If not, please install it fisrt:

```bash
tigo add hostbinder
```

Then run the following command:

```bash
tigo add fepanel
```

In your .tigorc, please set the configuration for this module:

```js
// .tigorc.js
module.exports = {
  plugins: {
    fepanel: {
      package: '@tigojs/fepanel',
      config: {
        distPath: '', // the dist path of tigo-panel
        domain: '', // a domain that you want to bind to the panel
      },
    },
  },
};
```

## Upgrade panel

If you want to upgrade the panel, you can use `@tigojs/cli` to do this quickly.

```bash
tigo panel upgrade
```

## License

MIT
