const define = function (app, engine) {
  const prefix = (app.config.db ? app.config.db.prefix : 'tigo') || 'tigo';
  const { STRING, UUID, UUIDV4 } = engine.Sequelize;

  const User = engine.define('user', {
    id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
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

  User.sync({ alter: true })

  return User;
};

module.exports = define;
