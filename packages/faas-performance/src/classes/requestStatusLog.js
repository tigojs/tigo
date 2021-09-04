const moment = require('moment');
const { getRequestStatusCollectionName } = require('../utils/collection');

class RequestStatusLog {
  constructor(app, db, lambdaId) {
    this.collection = db.collection(getRequestStatusCollectionName(lambdaId));
    if (app.tigo.faas.perm.maxKeepDays) {
      const { maxKeepDays } = app.tigo.faas.perm;
      this.collection.createIndex({ point: 1 }, { expireAfterSeconds: maxKeepDays * 86400 });
    }
  }
  async writeLog(isSuccess) {
    const current = moment();
    const min = current.minute();
    let point;
    if (min >= 30) {
      point = current.minute(30).second(0).millisecond(0).valueOf();
    } else {
      point = current.minute(0).second(0).millisecond(0).valueOf();
    }
    const stored = await this.collection.findOne({
      point,
    });
    if (stored) {
      if (isSuccess) {
        stored.success += 1;
      } else {
        stored.error += 1;
      }
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
        success: isSuccess ? 1 : 0,
        error: isSuccess ? 0 : 1,
      });
    }
  }
  async success() {
    await this.writeLog(true);
  }
  async error() {
    await this.writeLog(false);
  }
}

module.exports = RequestStatusLog;
