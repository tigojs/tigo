# @tigojs/cfs

Provide configuration files storage for tigo.

## Usage

Install this plugin with `@tigojs/cli`:

```bash
tigo add cfs
```

The storage service can store `.json`, `.xml` and `.yaml` files, all the files in the storage can be edited from the online editor in `tigo-panel`.

## Configuration

Here's a template:

```js
// .tigorc.js
module.exports = {
  plugins: {
    cfs: {
      package: '@tigojs/cfs',
      config: {
        sqlEngine: '',  // SQL engine name (string), if remains empty or not set, plugin will use the first available one.
        kvEngine: '',  // KV engine name, if remains empty or not set, plugin will use the first available one.
        kvConfig: {
          storagePath: '',  // storage path for kv engine (local)
          connect: {},  // connection info for kv engine (network)
        },  // Configuration object that will be passed to KV engine
        cache: {
          max: 500,  // max items in lru cache
          ttl: 60 * 60 * 1000,  // max age in lru cache
        },
      },
    },
  },
};
```

## License

MIT
