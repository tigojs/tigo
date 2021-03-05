const optionRules = {
  accessKey: {
    type: 'string',
    required: true,
  },
  secretKey: {
    type: 'string',
    required: true,
  },
  host: {
    type: 'string',
    required: true,
  },
  port: {
    type: 'number',
    required: false,
    min: 1,
    max: 65535,
  },
  https: {
    type: 'boolean',
    required: false,
  },
  base: {
    type: 'string',
    required: false,
  },
};

const getObjectRules = {
  bucketName: {
    type: 'string',
    required: true,
  },
  key: {
    type: 'string',
    required: true,
  },
};

const putObjectRules = {
  bucketName: {
    type: 'string',
    required: true,
  },
  key: {
    type: 'string',
    required: true,
  },
  file: {
    type: 'string',
    required: true,
  },
  force: {
    type: 'boolean',
    required: false,
  },
};

const removeObjectRules = {
  bucketName: {
    type: 'string',
    required: true,
  },
  key: {
    type: 'string',
    required: true,
  },
};

module.exports = {
  optionRules,
  getObjectRules,
  putObjectRules,
  removeObjectRules,
};
