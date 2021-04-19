const { verifyToken } = require("../utils/jwt");
const crypto = require('crypto');

const middleware = async function (ctx, next) {
  const { secret, maxTimeDelta } = ctx.tigo.auth;
  if (!ctx.header) {
    ctx.throw(400, '无法读取请求头');
  }
  if (!ctx.header.authorization) {
    ctx.throw(400, '无法获取鉴权信息');
  }
  const authorization = ctx.header.authorization;
  if (/^(B|b)earer\s?/.test(authorization)) {
    const token = authorization.replace(/^bearer\s/i, '');
    let decoded;
    try {
      decoded = await verifyToken(token, secret);
    } catch (err) {
      ctx.throw(401, 'Token无法解析');
    }
    if (!decoded) {
      ctx.throw(401, '用户信息无法解析');
    }
    ctx.state.user = decoded;
    return next();
  } else if (/^tigo_ak\s?/i.test(authorization)) {
    if (!ctx.__canAccessByApi) {
      ctx.throw(403, '无法访问');
    }
    const ak = authorization.replace(/^tigo_ak\s/i, '');
    const random = ctx.header['x-tigo-random'];
    const timestamp = ctx.header['x-tigo-timestamp'];
    const sign = ctx.header['x-tigo-sign'];
    if (!ak || !random || !timestamp || !sign) {
      ctx.throw(400, '缺乏必要参数');
    }
    // validate random
    if (random.length !== 16) {
      ctx.throw(400, '参数无效');
    }
    // validate timestamp
    const timestampValue = parseInt(timestamp, 10);
    const offset = maxTimeDelta || 10 * 1000; // 10s in ms
    const now = new Date().valueOf();
    if (
      timestampValue < now - offset
      || timestampValue > now + offset
    ) {
      ctx.throw(400, '请求无效');
    }
    // get user info
    let userInfo = ctx.service.auth.apiKey.cache.get(ak);
    if (!userInfo) {
      const dbItem = await ctx.model.auth.apiKey.findOne({
        where: {
          ak,
        },
      });
      if (!dbItem) {
        ctx.throw(401, '无法解析用户信息');
      }
      const user = await ctx.model.auth.user.findOne({
        attributes: ['id', 'username', 'scopeId'],
        where: {
          id: dbItem.uid,
        },
      });
      const { sk } = dbItem;
      const { id: uid, username, scopeId } = user;
      userInfo = { sk, uid, username, scopeId };
      ctx.service.auth.apiKey.cache.set(ak, userInfo);
    }
    // validate sign
    const { sk } = userInfo;
    const toSign = `${random}${timestamp}${sk}`;
    const signed = crypto.createHmac('md5', 'tigo').update(toSign).digest('hex');
    if (signed !== sign) {
      ctx.throw(401, '签名无效');
    }
    ctx.state.user = {
      uid: userInfo.uid,
      username: userInfo.username,
      scopeId: userInfo.scopeId,
    };
    return next();
  } else {
    ctx.throw(400, '缺乏必要参数');
  }
};

module.exports = middleware;
