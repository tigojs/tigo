const globalErrorHandler = {
  priority: 200,
  async install(ctx, next) {
    return next().catch((err) => {
      ctx.status = 500;
      if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
        ctx.set('Content-Type', 'application/json');
        ctx.body ={
          success: false,
          ...createHttpError('unknownError'),
        };
        return;
      }
      ctx.set('Content-Type', 'text/html');
      ctx.body = ctx.tigo.pages.unknownError;
    });
  }
}