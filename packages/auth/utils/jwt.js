const jwt = require('jsonwebtoken');

function createToken(user, secret) {
  const { id, username, scopeId } = user;
  const token = jwt.sign(
    {
      id,
      username,
      scopeId,
      type: 'auth',
    },
    secret,
    {
      expiresIn: '1h',
    },
  );
  const refreshToken = jwt.sign(
    {
      id,
      username,
      scopeId,
      type: 'refresh',
    },
    secret,
    {
      expiresIn: '7d',
    },
  );
  return { token, refreshToken };
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
