# @tigojs/api-proxy

Integrate api reverse proxy into your `tigo` server.

## Usage

This package depends on `@tigojs/hostbinder`, please add it to your `tigo` server first.

Then, we recommend to use `@tigojs/cli` to add this package, the cli tool will guide to you set up your configuration.

```bash
tigo add api-proxy
```

## Reference

Here's a configuration template:

```javascript
// .tigorc.js
module.exports = {
  plugins: {
    apiProxy: {
      package: '@tigojs/api-proxy',
      config: {
        domain: 'YOUR_DOMAIN',
      },
    },
  },
};
```

By default, the `domain` is a `String`, the root path of this domain is equal to the server root.

You can use this domain to access all the APIs.

If you want to proxy internal API and external API separately, you can set up your configuration like this:

```javascript
module.exports = {
  plugins: {
    apiProxy: {
      package: '@tigojs/api-proxy',
      config: {
        domain: {
          internal: 'INTERNAL_DOMAIN',
          external: 'EXTERNAL_DOMAIN',
        },
      },
      strict: true, // if true, access internal APIs by the domain for external APIs will be blocked
    },
  },
};
```

## License

MIT
