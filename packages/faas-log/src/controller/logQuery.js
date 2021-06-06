const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

class LogQueryController extends BaseController {
  getRoutes() {
    return {
      '/faas/log/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
    };
  }
  async handleList(ctx) {
    ctx.verifyParams({
      lambdaId: {
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
        min: 20,
        max: 100,
      },
    });
    const { lambdaId, beginTime, endTime, page, pageSize } = ctx.query;
    await ctx.tigo.faas.ownerCheck(ctx, lambdaId);
    // check time span
    if (endTime - beginTime <= 0 || endTime - beginTime >= ctx.tigo.faas.log.maxTimeSpan) {
      ctx.throw(400, 'Time span is invalid.');
    }
    // check collection
    const collections = await ctx.tigo.faas.log.db.listCollections({
      name: lambdaId,
    }).toArray();
    if (!collections.length) {
      ctx.body = successResponse({
        logs: [],
      });
      return;
    }
    // query logs
    const collection = ctx.tigo.faas.log.db.collection(lambdaId);
    const cond = {
      time: {
        $gt: beginTime,
        $lte: endTime,
      },
    };
    const total = await collection.find(cond).count();
    const logs = await collection
      .find(cond)
      .sort({
        time: -1,
      })
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
