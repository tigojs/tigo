const path = require('path');
const fs = require('fs');
const mime = require('mime');
const { BaseController } = require('@tigo/core');
const { MEMO_EXT_PATTERN } = require('@tigo/utils/constants/pattern');

const getMemoConf = (ctx) => {
  return ctx.tigo.config.static && ctx.tigo.config.static.memo;
}

class StaticFileController extends BaseController {
  getRoutes() {
    return {
      '/view/:scope/:name': {
        type: 'get',
        target: this.handleView,
        external: true,
      },
      '/static/:scope/:filename': {
        type: 'get',
        target: this.handleFile,
        external: true,
      },
    };
  }
  async handleFile(ctx) {
    const { scope, filename } = ctx.params;
    if (!/.+\..+/.test(filename)) {
      ctx.throw(400, '文件名不正确');
    }
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const useMemo = getMemoConf(ctx);
    if (
      !ctx.static[scope] ||
      !ctx.static[scope][ext] ||
      !ctx.static[scope][ext][base]
    ) {
      ctx.throw(404, '文件未找到');
    }
    const memo = MEMO_EXT_PATTERN.test(ext) && useMemo;
    const file = ctx.static[scope][ext][base];
    ctx.set('Cache-Control', 'max-age=3600');
    ctx.set('Content-Type', mime.getType(ext));
    ctx.body = memo ? file : fs.createReadStream(file);
  }
  async handleView(ctx) {
    const { scope, name } = ctx.params;
    const useMemo = getMemoConf(ctx);
    if (ctx.header.origin) {
      ctx.throw(400, '非法请求');
    }
    if (!ctx.static[scope] || !ctx.static[scope][name]) {
      ctx.throw(404, '页面未找到');
    }
    const view = ctx.static[scope][name];
    ctx.set('Cache-Control', 'max-age=3600');
    ctx.set('Content-Type', 'text/html');
    ctx.body = useMemo ? view : fs.createReadStream(view);
  }
}

module.exports = StaticFileController;
