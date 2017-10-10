var jwt = require('jsonwebtoken'),
		number = require('mongoose').model('Number'),
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
      let id = decoded.id;
      // check if a user exists
      number.findById(id, function(err, numbers) {
        if (err || !numbers) {
          return res.status(401).end();
        }
        req.number = {
          id: decoded.id
        }
        return next();
      });
    });
  };
};