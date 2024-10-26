# @tigojs/faas

This is a plugin for `tigo`, add serverless lambda service to the `tigo` server.

## Usage

Firstly, you should ensure your `tigo` server is already installed with a SQL database engine and a Key-Value database engine.

Then you can install this package with `npm`, but we recommend to use `@tigojs/cli` to install.

```bash
# if the cli not installed, run this line
npm install -g @tigojs/cli
tigo add faas
```

Note: Be sure your server has already installed `@tigojs/auth` or other authorization plugin.

## Configuration

Here's a template:

```javascript
// .tigorc.js
module.exports = {
  plugins: {
    faas: {
      package: '@tigojs/faas',
      config: {
        sqlEngine: '',  // SQL engine name (string), if remains empty or not set, plugin will use the first available one.
        kvEngine: '',  // KV engine name, if remains empty or not set, plugin will use the first available one.
        kvConfig: {
          storagePath: '',  // storage path for kv engine (local type)
        },  // Configuration object that will be passed to KV engine
        allowedRequire: [''],  // string array, packages allowd to be required from external in the lambda
        allowBuiltin: false, // allow using Node.js builtin modules in lambda
        allowedBuiltin: [], // allowed Node.js builtin modules which can be used in lambda
        maxWaitTime: 10,  // default max wait time for lambda executing
        lambdaKv: {
          enabled: false,  // whether enable the lambda kv
          storageConfig: {},  // same as kvConfig, to create another database instance for lambda kv
          cache: {
            enable: false, // lambda kv global cache will not be enabled by default
            max: 100,  // max values in lambda kv lru cache
            ttl: 10 * 1000,  // max value age
          },
        },
        oss: {
          cache: {
            max: 100,  // max objects in oss lru cache
            ttl: 10 * 1000,  // max object age
          },
        },
        cfs: {
          cache: {
            max: 100,  // max config content in cfs lru cache
            ttl: 10 * 1000,  // max config content age
          },
        },
        cache: {
          maxLambda: 100,  // max lambda in lru cache
          maxLambdaAge: 60 * 1000,  // max lambda age in lru cache
          maxIds: 1000,  // max lambda ids in lru cache
          maxIdAge: 60 * 1000,  // max lambda id age in lru cache
          maxPolicies: 100,  // max policy in lru cache
          maxPolicyAge: 60 * 1000,  // max policy age
        },
      },
    },
  },
};
```

The built-in `@tigojs/oss` and `@tigojs/cfs` support will be automatically enabled when you added them into your `tigo` server.

## Migration

See documentations under the `docs/migration` folder for more details.

## License

MIT
