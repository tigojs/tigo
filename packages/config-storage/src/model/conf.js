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
    type: {
      type: STRING,
    },
    remark: {
      type: STRING,
    }
  }, {
    tableName: `${prefix}_stored_config`,
  });

  Config.sync({ alter: true });

  Config.prototype.exists = async function (uid, type, name) {
    const item = this.findOne({
      where: {
        uid,
        name,
        type,
      },
    });
    return !!item;
  }

  return Config;
}

module.exports = define;
