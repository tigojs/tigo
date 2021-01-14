const { verifyToken } = require("../utils/jwt");

const middleware = async function (ctx, next) {
  const { secret } = ctx.app.tigo.auth;
  if (!ctx.header) {
    ctx.throw(400, '无法读取请求头');
  }
  if (!ctx.header.authorization) {
    ctx.throw(401, '无法获取Token');
  }
  const token = ctx.header.authorization.replace(/^B|bearer:\s?/, '');
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
};

module.exports = middleware;
