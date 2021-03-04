const buildInvalidMessage = (errs) => {
  let msg = '';
  errs.forEach((err, index) => {
    msg += err.message + index !== errs.length - 1 ? '\n' : '';
  });
  return msg;
};

module.exports = {
  buildInvalidMessage,
};
