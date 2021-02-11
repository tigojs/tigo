const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix();
  const { INTEGER, STRING } = engine.Sequelize;

  const AccessToken = engine.define('accessToken', {
    uid: {
      type: INTEGER,
    },
    token: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_auth_token`,
  });

  AccessToken.sync({ alter: true });

  return AccessToken;
};

module.exports = define;
