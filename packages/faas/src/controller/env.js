const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

class ScriptEnvController extends BaseController {
  getRoutes() {
    return {
      '/faas/env/get': {
        type: 'get',
        auth: true,
        target: this.handleGet,
      },
      '/faas/env/add': {
        type: 'post',
        auth: true,
        target: this.handleAdd,
      },
      '/faas/env/edit': {
        type: 'post',
        auth: true,
        target: this.handleEdit,
      },
      '/faas/env/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
      '/faas/env/clear': {
        type: 'post',
        auth: 'true',
        target: this.handleClear,
      },
    };
  }
  async handleGet(ctx) {

  }
  async handleAdd(ctx) {

  }
  async handleEdit(ctx) {

  }
  async handleDelete(ctx) {

  }
  async handleClear(ctx) {

  }
}