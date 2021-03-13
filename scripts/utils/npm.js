const NpmApi = require('npm-api');

const npm = new NpmApi();

const fetchPackageVersion = async (pkg) => {
  const repo = npm.repo(pkg);
  const package = await repo.package();
  return package.version;
};

module.exports = {
  fetchPackageVersion,
};
