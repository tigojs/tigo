const stackFilter = (stack) => {
  return stack.split('\n').filter((str) => {
    if (!str.includes('at ') || str.includes('lambda_userscript')) {
      return true;
    }
    return false;
  }).map((str) => {
    const nameMatch = str.match(/lambda_userscript_\d+\.js:(\d)/);
    if (nameMatch?.length) {
      return `userscript.js:${nameMatch[1]}`;
    }
    return str;
  }).join('\n');
};

module.exports = {
  stackFilter,
};
