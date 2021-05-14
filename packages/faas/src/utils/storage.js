const getEnvStorageKey = (lambdaId) => `faas_scriptEnv_${lambdaId}`;
const getStorageKey = (lambdaId) => `faas_script_${lambdaId}`;

module.exports = {
  getEnvStorageKey,
  getStorageKey,
};
