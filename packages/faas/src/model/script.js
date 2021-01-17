const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { INTEGER, STRING } = engine.Sequelize;

  const Script = engine.define('fassScript', {
    uid: {
      type: INTEGER,
      allowNull: false,
    },
    scopeId: {
      type: STRING,
      allowNull: false,
    },
    name: {
      type: STRING,
      allowNull: false,
    },
    scriptId: {
      type: STRING,
      allowNull: false,
    },
  }, {
    tableName: `${prefix}_faas_script`,
  });

  Script.sync({ alter: true });

  return Script;
};

module.exports = define;
