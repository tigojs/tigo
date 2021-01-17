const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { STRING } = engine.Sequelize;

  const User = engine.define('authUser', {
    username: {
      type: STRING,
    },
    password: {
      type: STRING,
    },
    scopeId: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_auth_user`,
  });

  User.sync({ alter: true });

  return User;
};

module.exports = define;
