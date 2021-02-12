const crypto = require('crypto');

const queryMethods = ['GET', 'HEAD'];

const middleware = async function (ctx, next) {
  let values;
  if (queryMethods.includes(this.method.toUpperCase())) {
    values = ctx.query;
  } else {
    values = ctx.request.body;
  }
  const { r, ak, timestamp } = values;
  if (!ak || typeof ak !== 'string') {
    ctx.throw(400, '请填写Access Key');
  }
  if (
    !r
    || typeof r !== 'string'
    || !timestamp
    || typeof timestamp !== 'number'
  ) {
    ctx.throw(400, '缺乏必要参数');
  }
  const now = new Date().valueOf();
  const offset = 30 * 1000;  // 30s in ms
  if (
    timestamp < now - offset
    || timestamp > now + offset
  ) {
    ctx.throw(400, '请求无效');
  }
  if (!sign || typeof sign !== 'string') {
    ctx.throw(400, '请对请求进行签名');
  }
  let userInfo = ctx.service.auth.apiKey.cache.get(ak);
  if (!userInfo) {
    const dbItem = await ctx.model.auth.apiKey.findOne({
      where: {
        ak,
      },
    });
    if (!dbItem) {
      ctx.throw(400, 'Access Key不存在');
    }
    const user = await ctx.model.auth.user.findOne({
      where: {
        id: dbItem.uid,
      },
    });
    const { sk } = dbItem;
    const { id: uid, username, scopeId } = user;
    userInfo = { sk, uid, username, scopeId };
    ctx.service.auth.apiKey.cache.set(ak, userInfo);
  }
  // check sign
  const toSign = `${r}${timestamp}${sk}`;
  const signed = crypto.createHmac('sha1', 'tigo').update(toSign).digest('hex');
  if (signed !== sign) {
    ctx.throw(400, '签名无效');
  }
  ctx.state.user = {
    uid: userInfo.uid,
    username: userInfo.username,
    scopeId: userInfo.scopeId,
  };
}

module.exports = middleware;
