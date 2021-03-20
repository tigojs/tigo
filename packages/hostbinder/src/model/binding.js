const { getTablePrefix } = require('@tigojs/utils');

const define = function(app, engine) {
  const prefix = getTablePrefix(app);
  const { INTEGER, STRING } = engine.Sequelize;

  const Binding = engine.define('hostBinding', {
    uid: {
      type: INTEGER,
    },
    domain: {
      type: STRING,
    },
    target: {
      type: STRING,
    },
  }, {
    tableName: `${prefix}_host_binding`,
  });

  Binding.domainExists = async function (domain) {
    const item = await this.findOne({
      where: {
        domain,
      },
    });
    return !!item;
  };

  return Binding;
};

module.exports = define;