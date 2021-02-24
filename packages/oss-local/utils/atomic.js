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
}

const unlock = (key) => {
  delete locks[key];
}

// push object to array safely
const safePush = async (db, key, value) => {
  if (lock(key)) {
    try {
      return await delayExec(safePushArray, db, key, value);
    } catch (err) {
      throw err;
    }
  }
  let list = await db.getObject(key);
  if (!list || !Array.isArray(list)) {
    list = [];
  }
  list.push(value);
  await db.putObject(key, value);
  unlock(key);
}

const safeRemove = async (db, key, value) => {
  if (lock(key)) {
    try {
      return await delayExec(safeDel, db, key, value);
    } catch (err) {
      throw err;
    }
  }
  const list = await db.getObject(key);
  if (!list || !Array.isArray(list)) {
    return;
  }
  const idx = list.findIndex((item) => item === value);
  list.splice(idx, 1);
  await db.putObject(key, value);
  unlock(key);
}

module.exports = {
  safePush,
  safeRemove,
  lock,
  unlock,
  delayExec,
};
