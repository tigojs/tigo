const merge = require('deepmerge')

const locks = {};

const delayExec = (fn, ...args) =>
  new Promise((resolve, reject) => {
    setImmediate(() => {
      try {
        resolve(fn(...args));
      } catch (err) {
        reject(err);
      }
    });
  });

const lock = (key) => {
  const ret = locks[key];
  locks[key] = true;
  return ret;
};

const unlock = (key) => {
  delete locks[key];
};

// push object to array safely
const safePush = async (db, key, value) => {
  if (lock(key)) {
    return await delayExec(safePush, db, key, value);
  }
  let list;
  try {
    list = await db.getObject(key);
  } catch (err) {
    unlock(key);
    throw err;
  }
  if (!list || !Array.isArray(list)) {
    list = [];
  }
  list.push(value);
  try {
    await db.putObject(key, list);
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
};

const safeDel = async (db, key, cond) => {
  if (lock(key)) {
    return await delayExec(safeDel, db, key, cond);
  }
  const obj = await db.get(key);
  if (typeof cond === 'function') {
    if (!cond(obj)) {
      unlock(key);
      const err = new Error('Object changed');
      err.objChanged = true;
      throw err;
    }
  }
  try {
    await db.del(key);
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
}

const safeRemove = async (db, key, value) => {
  if (lock(key)) {
    return await delayExec(safeRemove, db, key, value);
  }
  let list;
  try {
    list = await db.getObject(key);
  } catch (err) {
    unlock(key);
    throw err;
  }
  if (!list || !Array.isArray(list)) {
    return;
  }
  const idx = list.findIndex((item) => item === value);
  list.splice(idx, 1);
  try {
    await db.putObject(key, list);
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
};

const safeCreateObject = async (db, key, value) => {
  if (lock(key)) {
    return await delayExec(safeInitHeadNode, db, key, value);
  }
  try {
    if (!(await db.hasObject(key))) {
      await db.putObject(key, value);
    }
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
};

const safePutObject = async (db, key, value) => {
  if (lock(key)) {
    return await delayExec(safePutObject, db, key, value);
  }
  try {
    await db.putObject(key, value);
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
};

const safeMergeObject = async(db, targetKey, ...source) => {
  if (lock(targetKey)) {
    return await delayExec(safeMergeObject, db, targetKey, ...source);
  }
  let target;
  try {
    target = await db.getObject(targetKey);
  } catch (err) {
    unlock(targetKey);
    throw err;
  }
  let merged;
  source.forEach((obj) => {
    merged = merge(merged || target, obj);
  });
  try {
    await db.putObject(targetKey, merged);
  } catch (err) {
    unlock(targetKey);
    throw err;
  }
  unlock(targetKey);
}

const safeInsertNode = async (db, prevKey, key, value) => {
  const delay = async () => {
    return await delayExec(safeInsertNode, db, prevKey, key, value);
  };
  if (lock(prevKey)) {
    return await delay();
  }
  let prevNode;
  try {
    prevNode = await db.getObject(prevKey);
  } catch (err) {
    unlock(prevKey);
    throw err;
  }
  const nextKey = prevNode.next;
  let nextNode;
  if (nextKey) {
    if (lock(nextKey)) {
      unlock(prevKey);
      return await delay();
    }
    nextNode = await db.getObject(nextKey);
  }
  // update data in db
  Object.assign(value, {
    prev: prevKey,
    next: prevNode.next,
  });
  await db.putObject(key, value);
  prevNode.next = key;
  await db.putObject(prevKey, prevNode);
  if (nextNode) {
    nextNode.prev = key;
    await db.putObject(nextKey, nextNode);
    unlock(nextKey);
  }
  unlock(prevKey);
};

const safeRemoveNode = async (db, key) => {
  const delay = async () => {
    return await delayExec(safeRemoveNode, db, key);
  };
  const unlockAll = (obj) => {
    unlock(key);
    unlock(obj.prev);
    obj.next && unlock(obj.next);
  }
  if (lock(key)) {
    return await delay();
  }
  let obj;
  try {
    obj = await db.getObject(key);
  } catch (err) {
    unlock(key);
    throw err;
  }
  if (lock(obj.prev)) {
    unlock(key);
    return await delay();
  }
  if (obj.next) {
    if (lock(obj.next)) {
      unlock(key);
      unlock(obj.prev);
      return await delay();
    }
  }
  // 3 objs locked
  let prevNode;
  try {
    prevNode = await db.getObject(obj.prev);
  } catch (err) {
    unlockAll(obj);
    throw err;
  }
  let nextNode;
  if (obj.next) {
    try {
      nextNode = await db.getObject(obj.next);
    } catch (err) {
      unlockAll(obj);
      throw err;
    }
    nextNode.prev = obj.prev;
    prevNode.next = obj.next;
  } else {
    prevNode.next = null;
  }
  try {
    await db.putObject(obj.prev, prevNode);
    nextNode && await db.putObject(obj.next, nextNode);
    await db.del(key);
  } catch (err) {
    unlockAll(obj);
    throw err;
  }
  unlockAll(obj);
};

module.exports = {
  safeDel,
  safePush,
  safeRemove,
  safeCreateObject,
  safePutObject,
  safeMergeObject,
  safeInsertNode,
  safeRemoveNode,
};
