const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { INTEGER, STRING } = engine.Sequelize;

  const Script = engine.define('fassScript', {
    uid: {
      type: INTEGER,
    },
    name: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_faas_script`,
  });

  Script.sync({ alter: true });

  Script.hasName = async function (uid, name) {
    const item = this.findOne({
      where: {
        uid,
        name,
      },
    });
    return !!item;
  }

  return Script;
};

module.exports = define;
