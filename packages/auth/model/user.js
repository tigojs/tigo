const { getTablePrefix } = require('@tigo/utils');

const define = function (app, engine) {
  const prefix = getTablePrefix(app);
  const { STRING } = engine.Sequelize;

  const User = engine.define('authUser', {
    username: {
      type: STRING,
      allowNull: false,
    },
    password: {
      type: STRING,
      allowNull: false,
    },
  }, {
    tableName: `${prefix}_auth_user`,
  });

  User.sync({ alter: true });

  User.prototype.getById = async function (id) {
    return await this.findByPk(id);
  }

  return User;
};

module.exports = define;
