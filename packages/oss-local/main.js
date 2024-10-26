const path = require('path');
const fs = require('fs');
const fsPromise = require('fs/promises');
const { safePush, safeRemove, safeCreateObject, safeInsertNode, safeRemoveNode, safeMergeObject } = require('./utils/atomic');
const { getBucketListKey, getDirectoryHeadKey, getObjectMetaKey, getDirectoryMetaKey, getBucketPolicyKey, getBucketPolicyCacheKey, getHash2FileIdKey, getFileId2HashKey } = require('./utils/keys');
const { isBucketEmpty, getDirectoryPath, getLastDirectoryNode, recursiveCheckParent, recursiveCheckEmpty } = require('./utils/bucket');
const { v4: uuidv4 } = require('uuid');
const { LRUCache } = require('lru-cache');
const mime = require('mime');

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
      ttl: 1000 * 60 * 60 * 3, // 3 hrs
    });
    // put things on this
    this.app = app;
    this.config = config;
    this.kv = kvEngine.openDatabase(app, secondArg);
    this.fileStoragePath = fileStoragePath;
    app.logger.setPrefix(null);
  }
  async listBuckets({ scopeId }) {
    const list = await this.kv.getObject(getBucketListKey(scopeId));
    return list;
  }
  async bucketExists({ scopeId, bucketName }) {
    const list = await this.kv.getObject(getBucketListKey(scopeId));
    if (!list || !Array.isArray(list) || !list.length) {
      return false;
    }
    return list.includes(bucketName);
  }
  async makeBucket({ scopeId, bucketName }) {
    await safePush(this.kv, getBucketListKey(scopeId), bucketName);
  }
  async removeBucket({ scopeId, bucketName }) {
    if (!(await isBucketEmpty(this.kv, scopeId, bucketName))) {
      ctx.throw(403, 'Bucket不为空，请先删除所有文件再操作');
    }
    await safeRemove(this.kv, getBucketListKey(scopeId), bucketName);
  }
  async getBucketPolicy({ scopeId, bucketName }) {
    const cacheKey = getBucketPolicyCacheKey(scopeId, bucketName);
    const cached = this.policyCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const policy = await this.kv.getObject(getBucketPolicyKey(scopeId, bucketName));
    this.policyCache.set(cacheKey, policy);
    return policy;
  }
  async setBucketPolicy({ scopeId, bucketName, policy }) {
    await safeMergeObject(this.kv, getBucketPolicyKey(scopeId, bucketName), policy);
    this.policyCache.del(getBucketPolicyCacheKey(scopeId, bucketName));
  }
  async listObjects({ scopeId, bucketName, prefix, startAt, startAtType, pageSize }) {
    let startAtKey;
    if (startAt) {
      const objKey = `${prefix}/${startAt}`;
      if (startAtType === 'file') {
        startAtKey = getObjectMetaKey(scopeId, bucketName, objKey);
      } else {
        startAtKey = getDirectoryMetaKey(scopeId, bucketName, objKey);
      }
    } else {
      startAtKey = getDirectoryHeadKey(scopeId, bucketName, prefix);
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
  async getObject({ scopeId, bucketName, key }) {
    const meta = await this.kv.getObject(getObjectMetaKey(scopeId, bucketName, key));
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
    return meta;
  }
  async putObject({ scopeId, bucketName, key, file, force, hash, meta }) {
    const dirPath = getDirectoryPath(key);

    try {
      await recursiveCheckParent(this.kv, scopeId, bucketName, dirPath);
    } catch (err) {
      throw err;
    }

    let fileId;
    let hashExisted = false;

    if (hash) {
      fileId = await this.kv.getString(getHash2FileIdKey(hash));
      if (!fileId) {
        const err = new Error('Hash is not in the database.');
        err.hashNotFound = true;
        throw err;
      }
      hashExisted = true;
    } else {
      // write file to storage path
      fileId = uuidv4();
      const dest = path.resolve(this.fileStoragePath, `./${fileId}`);
      if (Buffer.isBuffer(file)) {
        await fsPromise.writeFile(dest, file);
        // generate meta, reassign file
        let type;
        const dotIdx = key.lastIndexOf('.');
        if (dotIdx >= 0) {
          type = mime.getType(key.substr(dotIdx + 1));
        }
        file = {
          size: file.byteLength,
          type,
          lastModifiedDate: new Date(),
          hash: null,
        };
      } else if (typeof file === 'object') {
        if (!file.path) {
          throw new Error('Cannot get cached file content from disk.');
        }
        await fsPromise.copyFile(file.path, dest);
        await fsPromise.unlink(file.path);
      }
      // record hash to the file
      if (file.hash) {
        await this.kv.put(getHash2FileIdKey(file.hash), fileId);
      }
    }

    // check if key exists
    const metaKey = getObjectMetaKey(scopeId, bucketName, key);
    let fileMeta = {
      key,
      name: key.replace(new RegExp(`${dirPath}\/?`), ''),
      file: fileId,
      isDirectory: false,
    };
    if (hashExisted) {
      // hash of file already in the db.
      if (!meta) {
        throw new Error('Meta is not found.');
      }
      fileMeta = {
        ...fileMeta,
        ...meta,
        hash,
      };
    } else {
      fileMeta = {
        ...fileMeta,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModifiedDate.valueOf(),
        hash: file.hash,
      };
    }
    const storedMeta = await this.kv.getObject(metaKey);
    if (storedMeta) {
      if (!force) {
        const err = new Error('Duplicated key');
        err.duplicated = true;
        throw err;
      }
      // put new meta to db
      await safeMergeObject(this.kv, metaKey, fileMeta);
    } else {
      // get last dir node (or last node)
      const dirHeadKey = getDirectoryHeadKey(scopeId, bucketName, dirPath);
      if (!(await this.kv.hasObject(dirHeadKey))) {
        await safeCreateObject(this.kv, dirHeadKey, {
          key: dirPath,
          isHead: true,
          next: null,
        });
      }
      const lastDirNode = await getLastDirectoryNode(this.kv, dirHeadKey);
      const lastDirKey = lastDirNode.isHead ? dirHeadKey : getDirectoryMetaKey(scopeId, bucketName, lastDirNode.key);
      // insert meta
      await safeInsertNode(this.kv, lastDirKey, metaKey, fileMeta);
    }
  }
  async removeObject({ scopeId, bucketName, key }) {
    const metaKey = getObjectMetaKey(scopeId, bucketName, key);
    const meta = await this.kv.getObject(metaKey);
    if (!meta) {
      const err = new Error('Could not find the object');
      err.notFound = true;
      throw err;
    }
    if (meta.hash && !this.config.keepFile) {
      // remove hash related pairs
      await this.kv.del(getHash2FileIdKey(meta.hash));
    }
    // remove meta node first
    await safeRemoveNode(this.kv, metaKey);
    // unlink file
    if (!this.config.keepFile) {
      const filePath = path.resolve(this.fileStoragePath, `./${meta.file}`);
      if (fs.existsSync(filePath)) {
        await fsPromise.unlink(filePath);
      }
    }
    // recursive check directory
    await recursiveCheckEmpty(this.kv, scopeId, bucketName, getDirectoryPath(key));
  }
}

module.exports = LocalStorageEngine;
