const stackFilter = (stack) => {
  return stack.split('\n').filter((str) => {
    if (!str.includes('at ') || str.includes('lambda_userscript')) {
      return true;
    }
    return false;
  }).map((str) => {
    if (str.includes('lambda_userscript')) {
      return str.replace(/\(.*lambda_userscript_\d+/, '(userscript');
    }
    return str;
  }).join('\n');
};

module.exports = {
  stackFilter,
};
