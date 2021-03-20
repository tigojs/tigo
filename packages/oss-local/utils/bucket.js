const { safeCreateObject, safeInsertNode, safeDel, safeRemoveNode } = require("./atomic");
const { getDirectoryHeadKey, getDirectoryMetaKey } = require("./keys");

const isBucketEmpty = async (db, username, bucketName) => {
  let rootHead;
  try {
    rootHead = await db.getObject(getDirectoryHeadKey(username, bucketName, '/'));
  } catch (err) {
    if (err.notFound) {
      return true;
    }
    throw err;
  }
  if (!rootHead || !rootHead.next) {
    return true;
  }
  return false;
};

const getDirectoryPath = (key) => {
  let filePath = key;
  if (filePath.startsWith('/')) {
    filePath = filePath.substr(1);
  }
  const idx = key.lastIndexOf('/');
  if (idx >= 0) {
    return filePath.substring(0, idx);
  }
  return '/';
}

const getLastDirectoryNode = async (db, node) => {
  // if type of node is string, node is actually a key.
  if (typeof node === 'string') {
    node = await db.getObject(node);
  }
  // if node is the last one, return it
  if (!node.next) {
    return node;
  }
  const next = await db.getObject(node.next);
  if (!next.isDirectory) {
    return node;
  }
  return await getLastDirectoryNode(db, next);
}

const recursiveCheckParent = async (db, username, bucketName, dir) => {
  if (dir === '/') {
    return;
  }
  // try to get dir meta
  const dirMetaKey = getDirectoryMetaKey(username, bucketName, dir);
  if (await db.hasObject(dirMetaKey)) {
    // if meta of current dir exists, meta of parent should exist too.
    return;
  }
  // if not exist, create the meta and add it to parent dir
  // get head node of parent dir from db;
  const parentDir = getDirectoryPath(dir);
  const parentDirHeadKey = getDirectoryHeadKey(username, bucketName, parentDir);
  // parent dir head node does not exist, create it
  if (!await db.hasObject(parentDirHeadKey)) {
    await safeCreateObject(db, parentDirHeadKey, {
      key: parentDir,
      isHead: true,
      next: null,
    });
  }
  // insert directory meta node to parent dir link
  const meta = {
    key: dir,
    name: dir.replace(new RegExp(`${parentDir}\/?`), ''),
    isDirectory: true,
  };
  await safeInsertNode(db, parentDirHeadKey, dirMetaKey, meta);
  // recursive check
  return await recursiveCheckParent(db, username, bucketName, parentDir);
}

const recursiveCheckEmpty = async (db, username, bucketName, dir) => {
  if (dir === '/') {
    return;
  }
  const dirHeadKey = getDirectoryHeadKey(username, bucketName, dir);
  const dirMetaKey = getDirectoryMetaKey(username, bucketName, dir);
  const dirHeadNode = await db.getObject(dirHeadKey);
  if (dirHeadNode.next) {
    return;
  }
  // directory is empty
  try {
    await safeDel(db, dirHeadKey, ((obj) => !obj.next))
    await safeRemoveNode(db, dirMetaKey);
  } catch (err) {
    if (err.objChanged) {
      // object changed, cannot remove
      return;
    }
    throw err;
  }
  const parentDir = getDirectoryPath(dir);
  return await recursiveCheckEmpty(db, username, bucketName, parentDir);
}

module.exports = {
  isBucketEmpty,
  getDirectoryPath,
  getLastDirectoryNode,
  recursiveCheckParent,
  recursiveCheckEmpty,
};
