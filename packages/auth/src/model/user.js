const { getTablePrefix } = require('@tigojs/utils');

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

  return User;
};

module.exports = define;
