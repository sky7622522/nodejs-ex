var passport = require('passport');

module.exports = function() {

  // loading strategies
  var fbStrategy = require('./fbLogin')();
  var localStrategy = require('./localLogin')();

  // used to serialize the user for the session
  passport.serializeUser(function(token, done) {
    done(null, token);
  });

  // used to deserialize the user
  passport.deserializeUser(function(obj, done) {
    done(err, obj);
  });

  passport.use('fb-login', fbStrategy);
  passport.use('local-login', localStrategy);

  
  

};