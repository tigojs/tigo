const { getDirectoryHeadKey } = require("./keys");

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

module.exports = {
  isBucketEmpty,
  getDirectoryPath,
};
