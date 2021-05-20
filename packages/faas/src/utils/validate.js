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

module.exports = {
  validatePolicy,
};
