const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { INTEGER, STRING } = engine.Sequelize;

  const ApiKey = engine.define('ApiKey', {
    uid: {
      type: INTEGER,
    },
    ak: {
      type: STRING,
    },
    sk: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_auth_apikeys`,
  });

  ApiKey.sync({ alter: true });

  return ApiKey;
};

module.exports = define;