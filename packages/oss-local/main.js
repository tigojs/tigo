const path = require('path');
const fs = require('fs');
const fsPromise = require('fs/promises');
const { safePush, safeRemove, delayExec, lock, unlock } = require('./utils/atomic');
const { getBucketListKey, getDirectoryHeadKey, getObjectMetaKey } = require('./utils/keys');
const { isBucketEmpty, getDirectoryPath } = require('./utils/bucket');
const { v4: uuidv4 } = require('uuid');

class LocalStorageEngine {
  constructor(app, config) {
    app.logger.setPrefix('oss-local');
    config = config || {};
    // init kv database engine
    let kvEngine;
    config.kvStorage = config.kvStorage || {};
    if (config.kvStorage.engine) {
      const engine = app.dbEngine.kv[config.kvStorage.engine];
      if (!engine) {
        throw new Error('The specific KV storage engine does not exist');
      }
      kvEngine = engine;
    } else {
      const keys = Object.keys(app.dbEngine.kv);
      if (!keys.length) {
        throw new Error('No avaliable KV storage engine');
      }
      kvEngine = app.dbEngine.kv[keys[0]];
      app.logger.warn(`Using ${kvEngine.name} for oss-local by default`);
    }
    let secondArg;
    if (kvEngine.storageType === 'local') {
      const configPath = config.kvStorage.path;
      if (configPath) {
        if (!fs.existsSync(configPath)) {
          throw new Error('KV storage path does not exist');
        }
        secondArg = configPath;
      } else {
        const kvPath = path.resolve(app.config.runDirPath, './oss/meta');
        if (!fs.existsSync(kvPath)) {
          fs.mkdirSync(kvPath, { recursive: true });
        }
        secondArg = kvPath;
      }
    } else {
      secondArg = config.kvStorage.connection;
    }
    // init file storage
    config.fileStorage = config.fileStorage || {};
    let fileStoragePath;
    const configPath = config.fileStorage.path;
    if (configPath) {
      if (!fs.existsSync(configPath)) {
        throw new Error('File storage path does not exist');
      }
      fileStoragePath = configPath;
    } else {
      fileStoragePath = path.resolve(app.config.runDirPath, './oss/files');
      if (!fs.existsSync(fileStoragePath)) {
        fs.mkdirSync(fileStoragePath, { recursive: true });
      }
    }
    // put things on this
    this.app = app;
    this.config = config;
    this.kv = kvEngine.openDatabase(app, secondArg);
    app.logger.setPrefix(null);
  }
  async listBuckets({ username }) {
    try {
      const list = await this.kv.getObject(getBucketListKey(username));
      return list;
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw err;
    }
  }
  async bucketExists({ username, bucketName }) {
    let list;
    try {
      list = await this.kv.getObject(getBucketListKey(username));
    } catch (err) {
      if (err.notFound) {
        return false;
      }
      throw err;
    }
    return list.includes(bucketName);
  }
  async makeBucket({ username, bucketName }) {
    await safePush(this.kv, getBucketListKey(username), bucketName);
  }
  async removeBucket({ username, bucketName }) {
    if (!await isBucketEmpty(this.kv, username, bucketName)) {
      ctx.throw(403, 'Bucket不为空，请先删除所有文件再操作');
    }
    await safeRemove(this.kv, getBucketListKey(username), bucketName);
  }
  async listObjects({
    username,
    bucketName,
    startAt,
    pageSize,
  }) {
    
  }
  async putObject(args) {
    const { username, bucketName, key, file } = args;
    const dirPath = getDirectoryPath(key);
    const dirHeadKey = getDirectoryHeadKey(username, bucketName, dirPath);
    if (lock(dirHeadKey)) {
      return await delayExec(this.putObject, args);
    }
    let dirHead;
    let isNewDir = false;
    try {
      dirHead = await this.kv.getObject(dirHeadKey);
    } catch (err) {
      if (err.notFound) {
        dirHead = null;
        isNewDir = true;
      } else {
        unlock(dirHeadKey);
        throw err;
      }
    }
    if (!dirHead) {
      dirHead = {};
      isNewDir = true;
    }
    let headNext;
    if (dirHead.next) {
      if (lock(dirHead.next)) {
        return await delayExec(this.putObject, args);
      }
      try {
        headNext = await this.kv.getObject(dirHead.next);
      } catch (err) {
        unlock(dirHead.next);
        if (!err.notFound) {
          throw err;
        }
      }
    }
    const fileId = uuidv4();
    const dest = path.resolve(this.fileStoragePath, `./${fileId}`);
    await fsPromise.copyFile(file.path, dest);
    await fsPromise.unlink(file.path);
    const meta = {
      size: file.size,
      type: file.type,
      lastModified: file.lastModifiedDate,
      hash: file.hash,
      file: fileId,
      next: dirHead.next,
      prev: dirHeadKey,
    };
    const metaKey = getObjectMetaKey();
    // update
    try {
      await this.kv.putObject(metaKey, meta);
      if (headNext) {
        headNext.prev = metaKey;
        await this.kv.putObject(dirHead.next, headNext);
      }
      dirHead.next = metaKey;
      await this.kv.putObject(dirHeadKey, meta);
    } catch (err) {
      if (headNext) {
        unlock(dirHead.next);
      }
      unlock(dirHeadKey);
      throw err;
    }
    // unlock locks
    if (headNext) {
      unlock(dirHead.next);
    }
    unlock(dirHeadKey);
  }
  async removeObject({
    username,
    bucketName,
    key,
  }) {

  }
}

module.exports = LocalStorageEngine;
