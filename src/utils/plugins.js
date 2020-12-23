function pluginPackageExisted(packageName) {
  if (!this) {
    return false;
  }
  Object.keys(this).forEach((name) => {
    const { package } = this[name];
    if (package && package === packageName) {
      return true;
    }
  });
  return false;
}

module.exports = {
  pluginPackageExisted,
};
