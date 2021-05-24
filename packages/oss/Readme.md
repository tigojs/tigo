# @tigojs/oss

Provide OSS(Object Storage Service) support for `tigo`.

## Usage

Using `@tigojs/cli` to install this package:

```bash
tigo add oss
```

You need to choose an engine that implements the storage service.

We provide an engine named `@tigojs/oss-local`, it can store the objects in the local machine using a Key-Value database engine and system fs.

If you want to use this engine, be sure you have installed a Key-Value database engine to your `tigo` server, like `@tigojs/leveldb`.

## Configuration

Here's a template:

```js
// .tigorc.js
module.exports = {
  plugins: {
    oss: {
      package: '@tigojs/oss',
      config: {
        storage: {
          engine: '', // package name of the engine
          config: {}, // this object will be passed to the engine
        },
      },
    },
  },
};
```

## License

MIT
