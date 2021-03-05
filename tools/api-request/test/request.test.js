const { CONFIG_A, CONFIG_B, CONFIG_C, CONFIG_D } = require('./config');
const { getAgent } = require('../main');
const assert = require('assert');

describe('API request test', () => {
  it('Throw error when API auth info not present', () => {
    try {
      getAgent(CONFIG_A);
    } catch (err) {
      assert.strictEqual(err.message, 'Missing required parameters about API authentication.');
    }
  });
  it('Access API with ak & sk', async () => {
    const agent = getAgent(CONFIG_B);
    await agent.get('/common/apiAccessCheck');
  });
  it('Access API with wrong sk', async () => {
    const agent = getAgent(CONFIG_C);
    try {
      await agent.get('/common/apiAccessCheck');
    } catch (err) {
      assert.strictEqual(err.response.status, 401);
    }
  });
  it('Access API with prefix param', async () => {
    const agent = getAgent(CONFIG_D);
    await agent.get('/common/apiAccessCheck');
  });
  it('Fetch user info through API', async () => {
    const agent = getAgent(CONFIG_D);
    const res = await agent.get('/auth/getUserInfo');
    assert.strictEqual(res.status, 200);
    if (!res.body.data.username || !res.body.data.scopeId) {
      throw new Error('Data in response is not right.');
    }
  });
});