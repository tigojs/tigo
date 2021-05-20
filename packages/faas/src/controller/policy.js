const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { getPolicyKey } = require('../utils/storage');

const generalCheck = async (ctx, lambdaId) => {
  const lambda = await ctx.model.faas.script.findByPk(lambdaId);
  if (!lambda) {
    ctx.throw(400, '无法找到对应的函数');
  }
  if (lambda.scopeId !== ctx.state.user.scopeId) {
    ctx.throw(401, '无权访问');
  }
  return lambda;
};

class PolicyController extends BaseController {
  getRoutes() {
    return {
      '/faas/getPolicy': {
        type: 'get',
        auth: true,
        target: this.handleGetPolicy,
      },
      '/faas/setPolicy': {
        type: 'post',
        auth: true,
        target: this.handleSetPolicy,
      },
    };
  }
  async handleGetPolicy(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId } = ctx.query;
    await generalCheck(ctx, lambdaId);
    // get policy
    const policy = await ctx.service.faas.policy.get(ctx, lambdaId);
    if (policy) {
      ctx.body = successResponse(policy);
    } else {
      ctx.body = successResponse({});
    }
  }
  async handleSetPolicy(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
      policy: {
        type: 'object',
        required: true,
      },
    });
    const { lambdaId } = ctx.request.body;
    await generalCheck(ctx, lambdaId);
    // set policy
    await ctx.service.faas.policy.set(ctx, lambdaId, policy);
    ctx.body = successResponse();
  }
}

module.exports = PolicyController;
