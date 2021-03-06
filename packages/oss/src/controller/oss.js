const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

const checkBucketExists = async (ctx, scopeId, bucketName) => {
  return await ctx.tigo.oss.engine.bucketExists({ scopeId, bucketName });
};

class OssController extends BaseController {
  getRoutes() {
    return {
      '/storage/:scopeId/:bucket/*key': {
        type: 'get',
        target: this.handlePublicGet,
        external: true,
      },
      '/oss/listBuckets': {
        type: 'get',
        auth: true,
        target: this.handleListBuckets,
      },
      '/oss/bucketExists': {
        type: 'get',
        auth: true,
        apiAccess: true,
        target: this.handleBucketExists,
      },
      '/oss/makeBucket': {
        type: 'post',
        auth: true,
        target: this.handleMakeBucket,
      },
      '/oss/removeBucket': {
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
        apiAccess: true,
        target: this.handleGetObject,
      },
      '/oss/putObject': {
        type: 'post',
        auth: true,
        apiAccess: true,
        target: this.handlePutObject,
      },
      '/oss/removeObject': {
        type: 'post',
        auth: true,
        apiAccess: true,
        target: this.handleRemoveObject,
      },
      '/oss/instantlyPutObject': {
        type: 'post',
        auth: true,
        apiAccess: true,
        target: this.handleInstantlyPutObject,
      },
    };
  }
  async handlePublicGet(ctx) {
    const { scopeId, bucket: bucketName, key } = ctx.params;
    // validate policy
    const policy = await ctx.tigo.oss.engine.getBucketPolicy({ scopeId, bucketName });
    if (!policy || !policy.public) {
      ctx.throw(403, '禁止访问');
    }
    let file;
    try {
      file = await ctx.tigo.oss.engine.getObject({
        scopeId,
        bucketName,
        key: decodeURIComponent(key.substr(1)),
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
        scopeId: ctx.state.user.scopeId,
      });
    } catch (err) {
      ctx.logger.error('List bucket failed.', err);
      ctx.throw(500, '发生错误，无法列出Buckets');
    }
    if (!list || !Array.isArray(list) || !list.length) {
      list = [];
    }
    ctx.body = successResponse(list);
  }
  async handleBucketExists(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
    });
    const { bucketName } = ctx.query;
    const exists = await ctx.tigo.oss.engine.bucketExists({ scopeId, bucketName });
    ctx.body = successResponse({
      exists,
    });
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
      scopeId: ctx.state.user.scopeId,
      bucketName,
    };
    try {
      if (await checkBucketExists(ctx, opts.scopeId, opts.bucketName)) {
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
    const opts = {
      scopeId: ctx.state.user.scopeId,
      bucketName,
    };
    if (!(await checkBucketExists(ctx, opts.scopeId, opts.bucketName))) {
      ctx.throw(404, 'Bucket不存在');
    }
    try {
      await ctx.tigo.oss.engine.removeBucket(opts);
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
        scopeId: ctx.state.user.scopeId,
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
        type: 'object',
        required: true,
      },
    });
    const { bucketName, policy } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    await ctx.tigo.oss.engine.setBucketPolicy({
      scopeId,
      bucketName,
      policy,
    });
    ctx.tigo.oss.events.emit('policy-updated', { scopeId, policy });
    ctx.body = successResponse(null, '设置成功');
  }
  async handleListObjects(ctx) {
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
    });
    const { bucketName, prefix, startAt, startAtType, pageSize } = ctx.query;
    if (!(await checkBucketExists(ctx, ctx.state.user.scopeId, bucketName))) {
      ctx.throw(404, 'Bucket不存在');
    }
    // startAtType is required when startAt set
    if (startAt && !startAtType) {
      ctx.throw(400, '参数错误');
    }
    let list;
    try {
      list = await ctx.tigo.oss.engine.listObjects({
        scopeId: ctx.state.user.scopeId,
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
  async handleGetObject(ctx) {
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
    const { bucketName, key } = ctx.query;
    let file;
    try {
      file = await ctx.tigo.oss.engine.getObject({
        scopeId: ctx.state.user.scopeId,
        bucketName,
        key: decodeURIComponent(key),
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
  async handlePutObject(ctx) {
    ctx.request.body.force = ctx.request.body.force === 'true' || ctx.request.body.force === true;
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      key: {
        type: 'string',
        required: true,
      },
      force: {
        type: 'boolean',
        required: true,
      },
    });
    const { bucketName, key, force } = ctx.request.body;
    if (!(await checkBucketExists(ctx, ctx.state.user.scopeId, bucketName))) {
      ctx.throw(404, 'Bucket不存在');
    }
    try {
      await ctx.tigo.oss.engine.putObject({
        scopeId: ctx.state.user.scopeId,
        bucketName,
        key,
        file: ctx.request.files.file,
        force,
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
    const { bucketName, key } = ctx.request.body;
    if (!(await checkBucketExists(ctx, ctx.state.user.scopeId, bucketName))) {
      ctx.throw(404, 'Bucket不存在');
    }
    try {
      await ctx.tigo.oss.engine.removeObject({
        scopeId: ctx.state.user.scopeId,
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
  async handleInstantlyPutObject(ctx) {
    ctx.verifyParams({
      bucketName: {
        type: 'string',
        required: true,
      },
      key: {
        type: 'string',
        required: true,
      },
      force: {
        type: 'boolean',
        required: true,
      },
      hash: {
        type: 'string',
        required: true,
      },
      meta: {
        type: 'object',
        required: true,
      },
    });
    const { bucketName, key, force, hash, meta } = ctx.request.body;
    if (!(await checkBucketExists(ctx, ctx.state.user.scopeId, bucketName))) {
      ctx.throw(404, 'Bucket不存在');
    }
    try {
      await ctx.tigo.oss.engine.putObject({
        scopeId: ctx.state.user.scopeId,
        bucketName,
        key,
        force,
        hash,
        meta,
      });
    } catch (err) {
      if (err.duplicated) {
        ctx.throw(403, 'Key已存在');
      }
      if (err.hashNotFound) {
        ctx.throw(403, '找不到该Hash');
      }
      ctx.logger.error('Put object failed.', err);
      ctx.throw(500, '出现错误，添加失败');
    }
    ctx.body = successResponse(null, '添加成功');
  }
}

module.exports = OssController;
