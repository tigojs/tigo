const define = function (app, engine) {
  const prefix = (app.config.db ? app.config.db.prefix : 'tigo') || 'tigo';
  const { STRING } = engine.Sequelize;

  const User = engine.define('user', {
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

  return User;
};

module.exports = define;
