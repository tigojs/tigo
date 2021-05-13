# @tigojs/sqlite

Provide SQLite database support for `tigo`.

This plugin contains `Sequelize`, you can easily store or manage your data in the SQLite database.

## Usage

We recommend to use `@tigojs/cli` to install this plugin, the configuration will be inserted into your `.tigorc` automatically.

```bash
tigo add sqlite
```

Here's a template for the configuration of this plugin:

```javascript
// .tigorc.js
module.exports = {
  plugins: {
    sqlite: {
      package: '@tigojs/sqlite',
      config: {
        dbPath: null,   // path to place the database, default: `{server_root}/run/sqlite.db`
        wal: false,   // whether enable the wal mode for sqlite (good for performence)
        // see Sequelize's doc for more details.
        paranoid: false,
        underscored: true,
        freezeTableName: true,
      },
    },
  },
};
```

## License

MIT
