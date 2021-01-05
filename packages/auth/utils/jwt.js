const jwt = require('jsonwebtoken');

function createToken(user, secret) {

}

function verifyToken(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      }
      resolve(decoded);
    });
  });
}

module.exports = {
  createToken,
  verifyToken,
};
