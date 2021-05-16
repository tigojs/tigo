const { BaseService } = require('@tigojs/core');
const { getPolicyKey } = require('../utils/storage');

class LambdaPolicyService extends BaseService {
  async get(ctx, lambdaId) {
    let policy;
    try {
      policy = await ctx.tigo.faas.storage.getObject(getPolicyKey(lambdaId));
    } catch (err) {
      if (!err.notFound) {
        return null;
      }
      throw err;
    }
    return policy || null;
  }
  async set(ctx, lambdaId, policy) {
    await ctx.tigo.faas.storage.putObject(getPolicyKey(lambdaId), policy);
  }
};

module.exports = LambdaPolicyService;
