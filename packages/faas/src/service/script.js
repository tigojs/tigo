const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const vm2 = require('vm2');
const { BaseService } = require('@tigo/core');

const USERSCRIPT_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../template/userscript.js'),
  { encoding: 'utf-8' },
);

const getScriptKey = (id) => `faas_script_${id || uuid.v4()}`;

const vm = new NodeVM();

class ScriptService extends BaseService {
  async exec(ctx, scriptId) {

  }
  async write(ctx, content) {
    const scriptId = uuid.v4();
    await ctx.faas.storage.set(getScriptKey(scriptId), content);
    return scriptId;
  }
  async delete(ctx, scriptId) {

  }
}

module.exports = ScriptService;
