const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);

  const { INTEGER, STRING } = engine.Sequelize;
  const Config = engine.define('storedConfig', {
    uid: {
      type: INTEGER,
    },
    name: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_stored_config`,
  });

  Config.sync({ alter: true });

  Config.prototype.hasName = async function (uid, name) {
    const item = this.findOne({
      where: {
        uid,
        name,
      },
    });
    return !!item;
  }
}

module.exports = define;
