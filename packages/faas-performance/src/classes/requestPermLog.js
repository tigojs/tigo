const moment = require('moment');
const { getRequestPermCollectionName } = require('../utils/collection');

class RequestPermLog {
  constructor(app, db, lambdaId) {
    this.collection = db.collection(getRequestPermCollectionName(lambdaId));
    if (app.tigo.faas.perm.maxKeepDays) {
      const { maxKeepDays } = app.tigo.faas.perm;
      this.collection.createIndex({ point: 1 }, { expireAfterSeconds: maxKeepDays * 86400 });
    }
  }
  begin() {
    this.startTime = Date.now();
  }
  async end() {
    this.endTime = Date.now();
    this.executionTime = this.endTime - this.startTime;
    // calc avg per min
    const point = moment().startOf('minute').valueOf();
    const stored = await this.collection.findOne({
      point,
    });
    if (stored) {
      stored.avgTimeCost = (stored.avgTimeCost * stored.count + this.executionTime) / (stored.count + 1);
      stored.count += 1;
      await this.collection.updateOne(
        {
          point,
        },
        {
          $set: stored,
        }
      );
    } else {
      await this.collection.insertOne({
        point,
        avgTimeCost: this.executionTime,
        count: 1,
      });
    }
  }
}

module.exports = RequestPermLog;
