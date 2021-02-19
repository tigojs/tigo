const getEnvStorageKey = (scopeId, name) => `faas_scriptEnv_${scopeId}_${name}`;
const getStorageKey = (scopeId, name) => `faas_script_${scopeId}_${name}`;

module.exports = {
  getEnvStorageKey,
  getStorageKey,
};
