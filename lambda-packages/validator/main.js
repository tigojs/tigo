const Parameter = require('parameter');

const parameter = new Parameter({
  validateRoot: true,
  widelyUndefined: true,
});

module.exports = parameter.validate;
