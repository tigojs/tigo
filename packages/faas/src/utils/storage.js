const getEnvStorageKey = (lambdaId) => `faas_scriptEnv_${lambdaId}`;
const getStorageKey = (lambdaId) => `faas_script_${lambdaId}`;
const getPolicyKey = (lambdaId) => `faas_scriptPolicy_${lambdaId}`;

module.exports = {
  getEnvStorageKey,
  getStorageKey,
  getPolicyKey,
};
