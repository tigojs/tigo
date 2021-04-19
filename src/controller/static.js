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
      '/static/:scope/*filename': {
        type: 'get',
        target: this.handleFile,
        external: true,
      },
    };
  }
  async handleFile(ctx) {
    let { scope, filename } = ctx.params;
    const slashIdx = filename.lastIndexOf('/');
    if (slashIdx >= 0) {
      filename = filename.substr(slashIdx + 1);
    }
    if (!/.+\..+/.test(filename)) {
      ctx.throw(404, '文件名不正确');
    }
    const ext = path.extname(filename).substr(1);
    if (!ctx.static[scope] || !ctx.static[scope] || !ctx.static[scope][filename]) {
      ctx.throw(404, '文件未找到');
    }
    const file = ctx.static[scope][filename];
    ctx.set('Cache-Control', `max-age=${ctx.tigo.config.static?.cacheTtl || 3600}`);
    ctx.set('Content-Type', mime.getType(ext));
    if (typeof file === 'object') {
      // file is already in memory
      ctx.body = file.content;
    } else {
      ctx.body = fs.createReadStream(file);
    }
  }
}

module.exports = StaticFileController;
