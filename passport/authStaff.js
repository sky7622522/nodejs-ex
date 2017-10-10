var jwt = require('jsonwebtoken'),
		user = require('mongoose').model('User'),
		jwtSecret = 'the new taiwan power';

module.exports = function() {

  /**
   * Return the middleware function.
   */
  return function(req, res, next) {
    if (!req.headers.authorization) {
      return res.status(401).end();
    }
    // get the last part from a authorization header string like "bearer token-value"
    let token = req.headers.authorization.split(' ')[1];
    // decode the token using a secret key-phrase
    jwt.verify(token, jwtSecret, function(err, decoded) {
      // the 401 code is for unauthorized status
      if (err) { return res.status(401).end(); }
      let userId = decoded.id;
      // check if a user exists
      user.findById(userId, function(err, user) {
        if (err || !user || decoded.role !== '3') {
          return res.status(401).end();
        }
        req.member = {
          id: decoded.id,
          name: decoded.name,
          role: decoded.role
        }
        return next();
      });
    });
  };
};