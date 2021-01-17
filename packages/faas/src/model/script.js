const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { INTEGER, STRING } = engine.Sequelize;

  const Script = engine.define('fassScript', {
    uid: {
      type: INTEGER,
    },
    scopeId: {
      type: STRING,
    },
    name: {
      type: STRING,
    },
    scriptId: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_faas_script`,
  });

  Script.sync({ alter: true });

  return Script;
};

module.exports = define;
