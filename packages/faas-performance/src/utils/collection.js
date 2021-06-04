const getRequestPermCollectionName = (lambdaId) => `${lambdaId}_request`;
const getRequestStatusCollectionName = (lambdaId) => `${lambdaId}_request_status`;

module.exports = {
  getRequestPermCollectionName,
  getRequestStatusCollectionName,
};
