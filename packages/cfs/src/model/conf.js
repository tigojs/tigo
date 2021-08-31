const { getTablePrefix } = require('@tigojs/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { STRING } = engine.Sequelize;

  const Config = engine.define('storedConfig', {
    id: {
      type: STRING,
      primaryKey: true,
      allowNull: false,
    },
    scopeId: {
      type: STRING,
    },
    name: {
      type: STRING,
    },
    type: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_stored_config`,
  });

  Config.exists = async function (scopeId, type, name) {
    const item = await this.findOne({
      where: {
        scopeId,
        name,
        type,
      },
    });
    return !!item;
  }

  return Config;
}

module.exports = define;
