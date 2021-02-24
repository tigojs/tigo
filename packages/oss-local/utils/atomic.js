const locks = {};

const delayExec = (fn, ...args) => new Promise((resolve, reject) => {
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
    return await delayExec(safePushArray, db, key, value);
  }
  let list;
  try {
    list = await db.getObject(key);
  } catch (err) {
    unlock(key);
    if (!err.notFound) {
      throw err;
    }
  }
  if (!list || !Array.isArray(list)) {
    list = [];
  }
  list.push(value);
  try {
    await db.putObject(key, value);
  } catch (err) {
    unlock(key);
    throw err;
  }
  unlock(key);
};

const safeRemove = async (db, key, value) => {
  if (lock(key)) {
    return await delayExec(safeDel, db, key, value);
  }
  let list;
  try {
    list = await db.getObject(key);
  } catch (err) {
    unlock(key);
    if (!err.notFound) {
      throw err;
    }
  }
  if (!list || !Array.isArray(list)) {
    return;
  }
  const idx = list.findIndex((item) => item === value);
  list.splice(idx, 1);
  try {
    await db.putObject(key, value);
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
    if (!await db.hasObject(key)) {
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

const safeInsertNode = async (db, prevKey, key, value) => {
  const delay = async () => {
    return await delayExec(safeSetRelatedNodes, db, prevKey, key, value);
  }
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
  await db.putObject(key, value);
  prevNode.next = key;
  await db.putObject(prevKey, prevNode);
  if (nextNode) {
    nextNode.prev = key;
    await db.putObject(nextKey, nextNode)
    unlock(nextKey);
  }
  unlock(prevKey);
};

module.exports = {
  safePush,
  safeRemove,
  safeCreateObject,
  safePutObject,
  safeInsertNode,
};
