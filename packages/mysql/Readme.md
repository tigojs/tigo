# @tigojs/mysql

Provide MySQL database support for `tigo`.

## Install

We recommend to use `@tigojs/cli` to install this plugin, the cli tool will guide you to set up it.

```bash
# If you haven't installed @tigojs/cli, run this:
npm install -g @tigojs/cli
# Install the plugin with cli tool
tigo add mysql
```

## Configuration

Here's a template:

```javascript
// .tigorc.js
module.exports = {
  plugins: {
    mysql: {
      package: '@tigojs/mysql',
      config: {
        host: '127.0.0.1',
        port: 3306, // optional, default value is 3306.
        user: '',
        passsword: '',
        // Sequelize options, optional, see Sequelize's documentation for details.
        pool: {
          max: 30,
          min: 5,
          acquire: 30 * 1000,
          idle: 10 * 1000,
        },
        define: {
          paranoid: false,
          underscored: true,
          freezeTableName: true,
        },
        dialect: {
          charset: 'utf8mb4_unicode_ci',
        },
      },
    },
  },
};
```

## License

MIT
