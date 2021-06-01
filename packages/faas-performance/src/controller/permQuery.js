const { BaseController } = require('@tigojs/core');
const { parseContextQuery } = require('@tigojs/utils');

class PermQueryController extends BaseController {
  getRoutes() {
    return {
      '/faas/getRequestPermData': {
        type: 'get',
        auth: true,
        target: this.handleGetRequestPermData,
      }
    };
  }
  async handleGetRequestPermData(ctx) {
    parseContextQuery(ctx, ['beginTime', 'endTime']);
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
    });
    // check time span
    if (endTime - beginTime <= 0 || endTime - beginTime >= ctx.tigo.faas.perm.maxTimeSpan) {
      ctx.throw(400, 'Time span is invalid.');
    }
    // check owner
    const { lambdaId, beginTime, endTime } = ctx.query;
    await ctx.tigo.faas.ownerCheck(ctx, lambdaId);
    // get data
    const collection = ctx.tigo.faas.perm.db.collection(lambdaId);
    const data = await collection.find({
      point: {
        $gt: beginTime,
        $lte: endTime,
      },
    }).toArray();
    ctx.body = successResponse(data);
  }
};

module.exports = PermQueryController;
