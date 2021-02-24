const getBucketListKey = (username) => `oss-bucket-list_${username}`;
const getDirectoryHeadKey = (username, bucketName, dirPath) => `oss-head_${username}_${bucketName}_${dirPath}`;
const getDirectoryMetaKey = (username, bucketName, dirPath) => `oss-meta_dir_${username}_${bucketName}_${dirPath}`;
const getObjectMetaKey = (username, bucketName, key) => `oss-meta_obj_${username}_${bucketName}_${key}`;

module.exports = {
  getBucketListKey,
  getDirectoryHeadKey,
  getDirectoryMetaKey,
  getObjectMetaKey,
};
