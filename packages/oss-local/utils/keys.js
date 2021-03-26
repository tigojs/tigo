const getBucketListKey = (scopeId) => `oss-bucket-list_${scopeId}`;
const getBucketPolicyKey = (scopeId, bucketName) => `oss-policy_${scopeId}_${bucketName}`;
const getBucketPolicyCacheKey = (scopeId, bucketName) => `oss-policy_${scopeId}_${bucketName}`;
const getDirectoryHeadKey = (scopeId, bucketName, dirPath) => `oss-head_${scopeId}_${bucketName}_${dirPath}`;
const getDirectoryMetaKey = (scopeId, bucketName, dirPath) => `oss-meta_dir_${scopeId}_${bucketName}_${dirPath}`;
const getObjectMetaKey = (scopeId, bucketName, key) => `oss-meta_obj_${scopeId}_${bucketName}_${key}`;
const getHash2FileIdKey = (hash) => `oss-hash-file_${hash}`;

module.exports = {
  getBucketListKey,
  getBucketPolicyKey,
  getBucketPolicyCacheKey,
  getDirectoryHeadKey,
  getDirectoryMetaKey,
  getObjectMetaKey,
  getHash2FileIdKey,
};
