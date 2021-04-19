const { getTablePrefix } = require('@tigojs/utils');

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

  return ApiKey;
};

module.exports = define;
