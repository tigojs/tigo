const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { getRequestPermCollectionName, getRequestStatusCollectionName } = require('../utils/collection');

const requestDataQueryCheck = async (ctx) => {
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
  // check owner
  const { lambdaId, beginTime, endTime } = ctx.query;
  // check time span
  if (endTime - beginTime <= 0 || endTime - beginTime >= ctx.tigo.faas.perm.maxTimeSpan) {
    ctx.throw(400, 'Time span is invalid.');
  }
  await ctx.tigo.faas.ownerCheck(ctx, lambdaId);
};

class PermQueryController extends BaseController {
  getRoutes() {
    return {
      '/faas/perm/requestStatus': {
        type: 'get',
        auth: true,
        target: this.handleGetRequestStatusData,
      },
      '/faas/perm/requestExecTime': {
        type: 'get',
        auth: true,
        target: this.handleGetRequestExecTimeData,
      },
    };
  }
  async handleGetRequestStatusData(ctx) {
    await requestDataQueryCheck(ctx);
    const { lambdaId, beginTime, endTime } = ctx.query;
    // get data
    const collection = ctx.tigo.faas.perm.db.collection(getRequestStatusCollectionName(lambdaId));
    const data = await collection
      .aggregate([
        {
          $match: {
            point: {
              $gt: beginTime,
              $lte: endTime,
            },
          },
        },
        {
          $group: {
            _id: null,
            success: {
              $sum: 1,
            },
            error: {
              $sum: 1,
            },
          },
        }
      ])
      .toArray();
    ctx.body = successResponse(data);
  }
  async handleGetRequestExecTimeData(ctx) {
    await requestDataQueryCheck(ctx);
    const { lambdaId, beginTime, endTime } = ctx.query;
    // get data
    const collection = ctx.tigo.faas.perm.db.collection(getRequestPermCollectionName(lambdaId));
    const data = await collection
      .find({
        point: {
          $gt: beginTime,
          $lte: endTime,
        },
      })
      .toArray();
    ctx.body = successResponse(data);
  }
}

module.exports = PermQueryController;
