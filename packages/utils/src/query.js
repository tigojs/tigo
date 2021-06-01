const parseContextQuery = (ctx, needParse) => {
  if (!Array.isArray(needParse) || !Object.keys(ctx.query).length) {
    return;
  }
  needParse.forEach((key) => {
    if (ctx.query[key]) {
      ctx.query[key] = parseInt(ctx.query[key], 10);
    }
  });
};

module.exports = {
  parseContextQuery,
};
