const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { getLambdaId } = require('../utils/log');

class LogQueryController extends BaseController {
  getRoutes() {
    return {
      '/faas/log/query': {
        type: 'get',
        auth: true,
        target: this.handleQuery,
      },
    };
  }
  async handleQuery(ctx) {
    ctx.query.beginTime = parseInt(ctx.query.beginTime, 10);
    ctx.query.endTime = parseInt(ctx.query.endTime, 10);
    ctx.verifyParams({
      lambdaName: {
        type: 'string',
        required: true,
      },
      beginTime: {
        type: 'number',
        required: true,
      },
      endTime: {
        type: 'number',
        required: true,
      },
      page: {
        type: 'number',
        required: true,
        min: 1,
      },
      pageSize: {
        type: 'number',
        required: true,
        min: 50,
        max: 300,
      },
    });
    const { lambdaName, beginTime, endTime, page, pageSize } = ctx.query;
    // check time span
    if (endTime - beginTime <= 0 || endTime - beginTime >= ctx.tigo.faasLog.maxTimeSpan) {
      ctx.throw(400, 'Time span is invalid.');
    }
    // check collection
    const lambdaId = getLambdaId(ctx.state.user.scopeId, lambdaName);
    if (!(await ctx.tigo.faasLog.db.listCollection(lambdaId))) {
      ctx.body = successResponse({
        logs: [],
      });
      return;
    }
    // query logs
    const collection = ctx.tigo.faasLog.db.collection(lambdaId);
    const cond = {
      time: {
        $gt: beginTime,
        $lte: endTime,
      },
    };
    const total = await collection.find(cond).count();
    const logs = await collection
      .find(cond)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    ctx.body = successResponse({
      total,
      logs,
    });
  }
}

module.exports = LogQueryController;
