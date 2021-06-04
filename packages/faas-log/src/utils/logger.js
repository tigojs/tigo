const { buildLog } = require('./log');

class LambdaLogger {
  constructor(app, db, lambdaId) {
    this.collection = db.collection(lambdaId);
    if (app.tigo.faas.log.maxKeepDays) {
      this.collection.ensureIndex({ point: 1 }, { expireAfterSeconds: maxKeepDays * 86400 });
    }
  }
  async writeLog(type, contents) {
    const log = buildLog(type, contents);
    try {
      await this.collection.insertOne(log);
    } catch (err) {
      this.app.logger.error(`Failed to write lambda log. (id: ${this.lambdaId})`, err);
    }
  }
  debug(...contents) {
    this.writeLog('debug', contents);
  }
  info(...contents) {
    this.writeLog('info', contents);
  }
  warn(...contents) {
    this.writeLog('warn', contents);
  }
  error(...contents) {
    this.writeLog('error', contents);
  }
  fatal(...contents) {
    this.writeLog('fatal', contents);
  }
}

module.exports = LambdaLogger;
