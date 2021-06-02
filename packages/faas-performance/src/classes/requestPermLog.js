const nanoid = require('nanoid');
const moment = require('moment');
const { getRequestPermCollectionName } = require('../utils/collection');

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
    // calc avg per min
    const point = moment().startOf('minute').valueOf();
    const stored = await this.db.findOne({
      point,
    });
    if (stored) {
      stored.avgTimeCost = (avgTimeCost * stored.count + this.executionTime) / (stored.count + 1);
      stored.count += 1;
      await this.db.updateOne(
        {
          point,
        },
        {
          $set: stored,
        }
      );
    } else {
      await this.db.insertOne({
        point,
        avgTimeCost: this.executionTime,
        count: 1,
      });
    }
  }
}

module.exports = RequestPermLog;
