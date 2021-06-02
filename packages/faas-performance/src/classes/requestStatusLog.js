const { getRequestStatusCollectionName } = require('../utils/collection');

class RequestStatusLog {
  constructor(db, lambdaId) {
    this.db = db.collection(getRequestStatusCollectionName(lambdaId));
  }
  async writeLog(isSuccess) {
    const current = moment();
    const min = current.minute();
    let point;
    if (min >= 30) {
      point = current.minute(30).second(0).valueOf();
    } else {
      point = current.minute(0).second(0).valueOf();
    }
    const stored = await this.db.findOne({
      point,
    });
    if (stored) {
      if (isSuccess) {
        stored.success += 1;
      } else {
        stored.error += 1;
      }
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
