const { LRUCache } = require('lru-cache');

// cache the owner data
const ownerCache = new LRUCache({
  max: 1000,
  ttl: 60 * 1000,
  updateAgeOnGet: true,
});

const validatePolicy = (ctx, policy) => {
  // validate maxWaitTime
  if (policy.maxWaitTime) {
    let { maxWaitTime } = policy;
    maxWaitTime = parseInt(maxWaitTime, 10);
    if (isNaN(maxWaitTime)) {
      ctx.throw(400, 'maxWaitTime不合法');
    }
    if (maxWaitTime < 1 || maxWaitTime > 30) {
      ctx.throw(400, 'maxWaitTime只允许设置1-30s');
    }
    policy.maxWaitTime = maxWaitTime;
  }
};

/**
 * @param {object} ctx koa context
 * @param {string} lambdaId ID of lambda
 * @returns {object} Lambda script model instance
 */
const ownerCheck = async (ctx, lambdaId) => {
  let scopeId;
  const cached = ownerCache.get(lambdaId);
  if (cached) {
    scopeId = cached;
  }
  const lambda = await ctx.model.faas.script.findByPk(lambdaId);
  if (!lambda) {
    ctx.throw(400, '无法找到对应的函数');
  }
  scopeId = lambda.scopeId;
  // check owner
  if (scopeId !== ctx.state.user.scopeId) {
    ctx.throw(401, '无权访问');
  }
  ownerCache.set(lambdaId, lambda.scopeId);
  return lambda;
};

const setOwnerCache = (lambdaId, scopeId) => {
  ownerCache.set(lambdaId, scopeId);
};

const clearOwnerCache = (lambdaId) => {
  ownerCache.del(lambdaId);
};

module.exports = {
  validatePolicy,
  ownerCheck,
  setOwnerCache,
  clearOwnerCache,
};
