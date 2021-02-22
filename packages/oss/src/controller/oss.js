const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

class OssController extends BaseController {
  getRoutes() {
    return {
      '/oss/listBuckets': {
        type: 'get',
        auth: true,
        target: this.handleListBuckets,
      },
      '/oss/makeBucket': {
        type: 'post',
        auth: true,
        target: this.handleMakeBucket,
      },
      '/oss/removeBucket' :{
        type: 'post',
        auth: true,
        target: this.handleRemoveBucket,
      },
      '/oss/listObjects': {
        type: 'get',
        auth: true,
        target: this.handleListObjects,
      },
      '/oss/putObject': {
        type: 'post',
        auth: true,
        target: this.handlePutObject,
      },
      '/oss/removeObject': {
        type: 'post',
        auth: true,
        target: this.handleRemoveObject,
      },
    };
  }
  async handleListBuckets(ctx) {
    let list;
    try {
      list = await ctx.tigo.oss.engine.listBuckets({
        username: ctx.state.user.username,
      });
    } catch (err) {
      ctx.logger.error('List bucket failed.', err);
      ctx.throw(500, '发生错误，无法列出Buckets');
    }
    if (!list || !Array.isArray(list) || !list.length) {
      ctx.throw(404, '无法列出Buckets');
    }
    ctx.body = successResponse(list);
  }
  async makeBucket(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
    });
    ctx.tigo.oss.engine.makeBucket(ctx, {
      username: ctx.state.user.username,
      bucketName,
    });
  }
  async removeBucket(ctx) {

  }
  async putObject(ctx) {

  }
}

module.exports = OssController;
