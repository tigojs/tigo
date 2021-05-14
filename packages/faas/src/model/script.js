const { getTablePrefix } = require('@tigojs/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { STRING } = engine.Sequelize;

  const Script = engine.define('fassScript', {
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
  }, {
    tableName: `${prefix}_faas_script`,
  });

  Script.hasName = async function (scopeId, name) {
    const item = await this.findOne({
      where: {
        scopeId,
        name,
      },
    });
    return !!item;
  }

  if (process.env.NODE_ENV === 'dev' && process.env.DB_ENV === 'dev') {
    Script.sync({ alter: true });
  }

  return Script;
};

module.exports = define;
