const middleware = async function (ctx, next) {
  ctx.__canAccessByApi = true;
  return next();
}