const getBucketListKey = (username) => `oss-bucket-list_${username}`;
const getBucketPolicyKey = (username, bucketName) => `oss-policy_${username}_${bucketName}`;
const getBucketPolicyCacheKey = (username, bucketName) => `oss-policy_${username}_${bucketName}`;
const getDirectoryHeadKey = (username, bucketName, dirPath) => `oss-head_${username}_${bucketName}_${dirPath}`;
const getDirectoryMetaKey = (username, bucketName, dirPath) => `oss-meta_dir_${username}_${bucketName}_${dirPath}`;
const getObjectMetaKey = (username, bucketName, key) => `oss-meta_obj_${username}_${bucketName}_${key}`;

module.exports = {
  getBucketListKey,
  getBucketPolicyKey,
  getBucketPolicyCacheKey,
  getDirectoryHeadKey,
  getDirectoryMetaKey,
  getObjectMetaKey,
};
