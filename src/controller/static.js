const path = require('path');
const fs = require('fs');
const mime = require('mime');
const { BaseController } = require('@tigojs/core');

class StaticFileController extends BaseController {
  constructor(app) {
    super(app);
  }
  getRoutes() {
    return {
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
      ctx.throw(404, '文件名不正确');
    }
    const ext = path.extname(filename).substr(1);
    const base = path.basename(filename, `.${ext}`);
    if (!ctx.static[scope] || !ctx.static[scope][ext] || !ctx.static[scope][ext][base]) {
      ctx.throw(404, '文件未找到');
    }
    const file = ctx.static[scope][ext][base];
    ctx.set('Cache-Control', `max-age=${ctx.tigo.config.static?.cacheTtl || 3600}`);
    ctx.set('Content-Type', mime.getType(ext));
    if (file instanceof Buffer) {
      // file is already in memory
      ctx.body = file;
    } else {
      ctx.body = fs.createReadStream(file);
    }
  }
}

module.exports = StaticFileController;
