const stackFilter = (stack) => {
  return stack.split('\n').filter((str) => {
    if (!str.includes('at ') || str.includes('vm.js:')) {
      return true;
    }
    return false;
  }).map((str) => {
    if (str.includes('vm.js')) {
      return str.replace('vm.js', 'userscript');
    }
    return str;
  }).join('\n');
};

module.exports = {
  stackFilter,
};
