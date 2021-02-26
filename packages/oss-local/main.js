const path = require('path');
const fs = require('fs');
const fsPromise = require('fs/promises');
const { safePush, safeRemove, safeCreateObject, safePutObject, safeInsertNode, safeMergeObject } = require('./utils/atomic');
const { getBucketListKey, getDirectoryHeadKey, getObjectMetaKey, getDirectoryMetaKey, getBucketPolicyKey, getBucketPolicyCacheKey } = require('./utils/keys');
const { isBucketEmpty, getDirectoryPath, getLastDirectoryNode, recursiveCheckParent } = require('./utils/bucket');
const { v4: uuidv4 } = require('uuid');
const LRUCache = require('lru-cache');

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
    // create policyCache
    this.policyCache = new LRUCache({
      max: 500,
      maxAge: 1000 * 60 * 60 * 3, // 3 hrs
    });
    // put things on this
    this.app = app;
    this.config = config;
    this.kv = kvEngine.openDatabase(app, secondArg);
    this.fileStoragePath = fileStoragePath;
    app.logger.setPrefix(null);
  }
  async listBuckets({ username }) {
    const list = await this.kv.getObject(getBucketListKey(username));
    return list;
  }
  async bucketExists({ username, bucketName }) {
    const list = await this.kv.getObject(getBucketListKey(username));
    if (!list || !Array.isArray(list) || !list.length) {
      return false;
    }
    return list.includes(bucketName);
  }
  async makeBucket({ username, bucketName }) {
    await safePush(this.kv, getBucketListKey(username), bucketName);
  }
  async removeBucket({ username, bucketName }) {
    if (!(await isBucketEmpty(this.kv, username, bucketName))) {
      ctx.throw(403, 'Bucket不为空，请先删除所有文件再操作');
    }
    await safeRemove(this.kv, getBucketListKey(username), bucketName);
  }
  async getBucketPolicy({ username, bucketName }) {
    const cacheKey = getBucketPolicyCacheKey(username, bucketName);
    const cached = this.policyCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const policy = await this.kv.getObject(getBucketPolicyKey(username, bucketName));
    this.policyCache.set(cacheKey, policy);
    return policy;
  }
  async setBucketPolicy({ username, bucketName, policy }) {
    await safeMergeObject(this.kv, getBucketPolicyKey(username, bucketName), policy);
    this.policyCache.del(getBucketPolicyCacheKey(username, bucketName));
  }
  async listObjects({ username, bucketName, prefix, startAt, startAtType, pageSize }) {
    let startAtKey;
    if (startAt) {
      const objKey = `${prefix}/${startAt}`;
      if (startAtType === 'file') {
        startAtKey = getObjectMetaKey(username, bucketName, objKey);
      } else {
        startAtKey = getDirectoryMetaKey(username, bucketName, objKey);
      }
    } else {
      startAtKey = getDirectoryHeadKey(username, bucketName, prefix);
    }
    let node = await this.kv.getObject(startAtKey);
    if (!node) {
      const err = new Error('Start object does not exist.');
      err.startAtNotFound = true;
      throw err;
    }
    const list = [];
    while (node.next) {
      const obj = await this.kv.getObject(node.next);
      if (!obj) {
        throw new Error('Get next node error.');
      }
      list.push(obj);
      if (list.length >= pageSize) {
        return list;
      }
      node = obj;
    }
    return list;
  }
  async getObject({ username, bucketName, key }) {
    const meta = await this.kv.getObject(getObjectMetaKey(username, bucketName, key));
    if (!meta) {
      const err = new Error('Meta not found.');
      err.notFound = true;
      throw err;
    }
    const filePath = path.resolve(this.fileStoragePath, `./${meta.file}`);
    if (!fs.existsSync(filePath)) {
      const err = new Error('File not found.');
      err.notFound = true;
      throw err;
    }
    Object.assign(meta, {
      dataStream: fs.createReadStream(filePath),
    });
  }
  async putObject({ username, bucketName, key, file, force }) {
    const dirPath = getDirectoryPath(key);

    try {
      await recursiveCheckParent(this.kv, username, bucketName, dirPath);
    } catch (err) {
      throw err;
    }

    // write file to storage path
    const fileId = uuidv4();
    const dest = path.resolve(this.fileStoragePath, `./${fileId}`);
    await fsPromise.copyFile(file.path, dest);
    await fsPromise.unlink(file.path);

    // check if key exists
    const metaKey = getObjectMetaKey(username, bucketName, key);
    const storedMeta = await this.kv.getObject(metaKey);
    if (storedMeta) {
      if (!force) {
        const err = new Error('Duplicated key');
        err.duplicated = true;
        throw err;
      }
      // put new meta to db
      await safePutObject(metaKey, {
        size: file.size,
        type: file.type,
        lastModified: file.lastModifiedDate,
        hash: file.hash,
        file: fileId,
      });
    } else {
      // get last dir node (or last node)
      const dirHeadKey = getDirectoryHeadKey(username, bucketName, dirPath);
      if (!(await this.kv.hasObject(dirHeadKey))) {
        await safeCreateObject(this.kv, dirHeadKey, {
          key: dirPath,
          isHead: true,
          next: null,
        });
      }
      const lastDirNode = await getLastDirectoryNode(this.kv, dirHeadKey);
      const lastDirKey = lastDirNode.isHead ? dirHeadKey : getDirectoryMetaKey(username, bucketName, lastDirNode.key);
      const meta = {
        key: key,
        name: key.replace(dirPath, ''),
        size: file.size,
        type: file.type,
        lastModified: file.lastModifiedDate,
        hash: file.hash,
        file: fileId,
        isDirectory: false,
        prev: lastDirKey,
        next: lastDirNode.next,
      };
      // insert meta
      await safeInsertNode(this.kv, lastDirKey, metaKey, meta);
    }
  }
  async removeObject({ username, bucketName, key }) {
    const metaKey = getObjectMetaKey(username, bucketName, key);
    const meta = await this.kv.getObject(metaKey);
    if (!meta) {
      const err = new Error('Could not find the object');
      err.notFound = true;
      throw err;
    }
    // remove meta node first
    await safeRemoveNode(this.kv, metaKey);
    // unlink file
    await fsPromise.unlink(path.resolve(this.fileStoragePath, `./${meta.file}`));
    // recursive check directory
    await recursiveCheckParent(this.kv, username, bucketName, getDirectoryPath(key));
  }
}

module.exports = LocalStorageEngine;
