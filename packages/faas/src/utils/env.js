const getEnvStorageKey = (scriptId) => {
  return `faas_scriptEnv_${scriptId}`;
};

module.exports = {
  getEnvStorageKey,
};
