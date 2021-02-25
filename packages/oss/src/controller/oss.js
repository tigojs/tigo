const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const LRUCache = require('lru-cache');

const checkBucketExists = async (ctx, username, bucketName) => {
  return await ctx.tigo.oss.engine.bucketExists({ username, bucketName });
}

class OssController extends BaseController {3
  constructor(app) {
    super(app);
    this.scopeIdCache = new LRUCache({
      max: 100,
      maxAge: 60 * 60 * 1000 * 3,  // 3 hrs
    });
  }
  getRoutes() {
    return {
      '/storage/:scopeId/:bucket/*key': {
        type: 'get',
        target: handlePublicGet,
        external: true,
      },
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
      '/oss/getBucketPolicy': {
        type: 'get',
        auth: true,
        target: this.handleGetBucketPolicy,
      },
      '/oss/setBucketPolicy': {
        type: 'post',
        auth: true,
        target: this.handleSetBucketPolicy,
      },
      '/oss/listObjects': {
        type: 'get',
        auth: true,
        target: this.handleListObjects,
      },
      '/oss/getObject': {
        type: 'get',
        auth: true,
        target: this.handleGetObject,
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
  async handlePublicGet(ctx) {
    const { scopeId, bucket: bucketName, key } = ctx.params;
    let username = this.scopeIdCache.get(scopeId);
    if (!username) {
      const userInfo = await ctx.model.auth.user.findOne({
        attributes: ['username'],
        where: {
          scopeId,
        },
      });
      if (!userInfo) {
        ctx.throw(400, '无法找到对应的Bucket');
      }
      username = userInfo.username;
      this.scopeIdCache.set(scopeId, username);
    }
    // validate policy
    const policy = await ctx.tigo.oss.engine.getBucketPolicy({ username, bucketName });
    if (!policy || policy.accessType !== 'public') {
      ctx.throw(403, '禁止访问')
    }
    let file;
    try {
      file = await ctx.tigo.oss.engine.getObject({
        username,
        bucketName,
        key,
      });
    } catch (err) {
      if (err.notFound) {
        ctx.throw(404, '找不到对应的文件');
      } else {
        throw err;
      }
    }
    ctx.set('Content-Type', file.type);
    ctx.body = file.dataStream;
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
      if (await checkBucketExists(ctx, ...opts)) {
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
    if (!await checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(404, 'Bucket不存在');
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
  async handleGetBucketPolicy(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
    });
    const { bucketName } = ctx.query;
    let policy;
    try {
      policy = await ctx.tigo.oss.engine.getBucketPolicy({
        username: ctx.state.user.username,
        bucketName,
      });
    } catch (err) {
      if (err.notFound) {
        ctx.throw(404, '无法找到对应的策略');
      } else {
        throw err;
      }
    }
    ctx.body = successResponse(policy);
  }
  async handleSetBucketPolicy(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      policy: {
        type: 'string',
        required: true,
      },
    });
    const { bucketName, policy } = ctx.request.body;
    await ctx.tigo.oss.engine.setBucketPolicy({
      username: ctx.state.user.username,
      bucketName,
      policy,
    })
    ctx.body = successResponse(null, '设置成功');
  }
  async handleListObjects(ctx) {
    ctx.query.pageSize = parseInt(ctx.query.pageSize, 10);
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      prefix: {
        type: 'string',
        required: false,
      },
      // startAt is a file key
      startAt: {
        type: 'string',
        required: false,
      },
      startAtType: {
        type: 'enum',
        values: ['file', 'directory'],
        required: false,
      },
      pageSize: {
        type: 'number',
        required: true,
      },
      force: {
        type: 'boolean',
        required: true,
      },
    });
    if (!await checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(404, 'Bucket不存在');
    }
    // startAtType is required when startAt set
    if (startAt && !startAtType) {
      ctx.throw(400, '参数错误');
    }
    const { bucketName, prefix, startAt, startAtType, pageSize } = ctx.query;
    let list;
    try {
      list = await ctx.tigo.oss.engine.listObjects({
        username: ctx.state.user.username,
        bucketName,
        prefix,
        startAt,
        startAtType,
        pageSize,
      });
    } catch (err) {
      if (err.startAtNotFound) {
        ctx.throw(404, '无法找到起始对象数据');
      }
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
    if (!await checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(404, 'Bucket不存在');
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
      if (err.duplicated) {
        ctx.throw(403, 'Key已存在');
      }
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
    if (!await checkBucketExists(ctx, ctx.state.user.username, bucketName)) {
      ctx.throw(404, 'Bucket不存在');
    }
    const { bucketName, key } = ctx.request.body;
    try {
      await ctx.tigo.oss.engine.removeObject({
        username: ctx.state.user.username,
        bucketName,
        key,
      });
    } catch (err) {
      if (err.notFound) {
        ctx.throw(404, '对象不存在');
      }
      ctx.logger.error('Remove object failed.', err);
      ctx.throw(500, '出现错误，删除失败');
    }
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = OssController;
