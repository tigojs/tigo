const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const mime = require('mime');
const LRUCache = require('lru-cache');
const { Readable } = require('stream');
const { BaseController } = require('@tigojs/core');
const { MEMO_EXT_PATTERN, MEMO_BUFFER_EXT_PATTERN } = require('@tigojs/utils/constants/pattern');

const getMemoConf = (ctx) => {
  return !!ctx.tigo.config?.static?.memo;
};

// you can lower the settings if your server isn't that good.
const cache = new LRUCache({
  max: 100, // Allow at most 100 static files in mem
  maxAge: 30, // Up to 30s nobody access the file, remove it from mem
  updateAgeOnGet: true,
  dispose: (filePath, v) => {
    if (watched[filePath]) {
      watched[filePath].close();
      delete watched[filePath];
    }
  },
});

const watched = {};

const createWatch = (app, filePath) => {
  const watcher = fs.watch(filePath, null, () => {
    cache.del(filePath);
  });
  watcher.on('error', (err) => {
    app.logger.error(`Failed to watch file ${filePath}`, err);
  });
  watched[filePath] = watcher;
};

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
      ctx.throw(400, '文件名不正确');
    }
    const ext = path.extname(filename).substr(1);
    const base = path.basename(filename, `.${ext}`);
    const useMemo = getMemoConf(ctx);
    if (!ctx.static[scope] || !ctx.static[scope][ext] || !ctx.static[scope][ext][base]) {
      ctx.throw(404, '文件未找到');
    }
    const bufferMemo = MEMO_BUFFER_EXT_PATTERN.test(ext);
    const textMemo = MEMO_EXT_PATTERN.test(ext);
    const canMemo = textMemo || bufferMemo;
    const memo = canMemo && useMemo;
    const file = ctx.static[scope][ext][base];
    ctx.set('Cache-Control', 'max-age=3600');
    ctx.set('Content-Type', mime.getType(ext));
    if (memo) {
      // all things are in memo
      ctx.body = file;
    } else {
      if (!canMemo) {
        ctx.body = fs.createReadStream(file);
      } else {
        // in this case file is actually the absolute file path
        const cached = cache.get(file);
        if (cached) {
          ctx.body = cached;
        } else {
          const content = textMemo ? await fsp.readFile(file, { encoding: 'utf-8' }) : await fsp.readFile(file);
          ctx.body = content;
          cache.set(file, content);
          createWatch(ctx.app, file);
        }
      }
    }
  }
}

module.exports = StaticFileController;
