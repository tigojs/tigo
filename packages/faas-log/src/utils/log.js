const buildLog = (type, contents) => {
  if (!contents.length) {
    // no content, regard as invalid log
    return null;
  }
  // build message
  const message = contents.map((content) => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return `${content}`;
  }).join(' ');
  return {
    time: Date.now(),
    type,
    message,
  };
};

module.exports = {
  buildLog,
};
