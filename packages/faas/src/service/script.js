const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const { BaseService } = require('@tigo/core');;

const USERSCRIPT_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../template/userscript.js'),
  { encoding: 'utf-8' },
);

class ScriptService extends BaseService {
  async exec(ctx, scriptId) {

  }
  async write(ctx, content) {
    const scriptId = uuid.v4();
  }
  async delete(ctx, scriptId) {

  }
}

module.exports = ScriptService;
