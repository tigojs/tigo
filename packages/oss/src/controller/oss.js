const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

const checkBucketExists = (ctx, username, bucketName) => {
  return await ctx.tigo.oss.engine.bucketExists({ username, bucketName });
}

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
  async handleMakeBucket(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
    });
    const { bucketName } = ctx.request.body;
    const opts = {
      username: ctx.state.user.username,
      bucketName,
    };
    try {
      if (checkBucketExists(ctx, ...opts)) {
        ctx.throw(400, 'Bucket已存在');
      }
      await ctx.tigo.oss.engine.makeBucket(opts);
    } catch (err) {
      ctx.logger.error('Make bucket failed.', err);
      ctx.throw(500, '无法创建Bucket');
    }
    ctx.body = successResponse(null, '创建成功');
  }
  async handleRemoveBucket(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
    });
    const { bucketName } = ctx.request.body;
    if (!checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(400, 'Bucket不存在');
    }
    try {
      await ctx.tigo.oss.engine.removeBucket({
        username: ctx.state.user.username,
        bucketName,
      });
    } catch (err) {
      ctx.logger.error('Remove bucket failed.', err);
      ctx.throw(500, '无法删除Bucket');
    }
    ctx.body = successResponse(null, '删除成功');
  }
  async handleListObjects(ctx) {
    ctx.query.pageSize = parseInt(ctx.query.pageSize, 10);
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      // startAt is a file key
      startAt: {
        type: 'string',
        required: false,
      },
      pageSize: {
        type: 'number',
        required: true,
      },
    });
    if (!checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(400, 'Bucket不存在');
    }
    const { bucketName, startAt, pageSize } = ctx.query;
    let list;
    try {
      list = await ctx.tigo.oss.engine.listObjects({
        username: ctx.state.user.username,
        bucketName,
        startAt,
        pageSize,
      });
    } catch (err) {
      ctx.logger.error('List objects failed.', err);
      ctx.throw(500, '无法列出文件');
    }
    ctx.body = successResponse(list);
  }
  async handlePutObject(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      key: {
        type: 'string',
        required: true,
      },
    });
    if (!checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(400, 'Bucket不存在');
    }
    const { bucketName, key } = ctx.request.body;
    try {
      await ctx.tigo.oss.engine.putObject({
        username: ctx.state.user.username,
        bucketName,
        key,
        file: ctx.request.files.file,
      });
    } catch (err) {
      ctx.logger.error('Put object failed.', err);
      ctx.throw(500, '出现错误，添加失败');
    }
    ctx.body = successResponse(null, '添加成功');
  }
  async handleRemoveObject(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      key: {
        type: 'string',
        required: true,
      },
    });
    if (!checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(400, 'Bucket不存在');
    }
    const { bucketName, key } = ctx.request.body;
    try {
      await ctx.tigo.oss.engine.removeObject({
        username: ctx.state.user.username,
        bucketName,
        key,
      });
    } catch (err) {
      ctx.logger.error('Remove object failed.', err);
      ctx.throw(500, '出现错误，删除失败');
    }
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = OssController;
