const getEnvStorageKey = (scopeId, name) => {
  return `faas_scriptEnv_${scopeId}_${name}`;
};

module.exports = {
  getEnvStorageKey,
};
