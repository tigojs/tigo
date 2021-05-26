const nanoid = require('nanoid');
const { getRequestPermCollectionName } = require('../utils');

class RequestPermLog {
  constructor(db, lambdaId) {
    this.db = db.collection(getRequestPermCollectionName(lambdaId));
  }
  begin() {
    this.executionId = nanoid();
    this.startTime = Date.now();
  }
  async end() {
    this.endTime = Date.now();
    this.executionTime = this.endTime - this.startTime;
    await this.db.insertOne({
      executionId: this.executionId,
      beginTime: this.beginTime,
      endTime: this.endTime,
      executionTime: this.executionTime,
    });
  }
}

module.exports = RequestPermLog;
