var passport = require('passport'),
    mongoose = require('mongoose'),
    jwt = require('jsonwebtoken'),
    jwtSecret = 'the new taiwan power',
		user = mongoose.model('User'),
    doctor = mongoose.model('Doctor'),
		Strategy = require('passport-facebook').Strategy;

module.exports = function() {

  return new Strategy({
    clientID: '1741455196111460',
    clientSecret: 'de7db91a7bf8477a5dc3ece1c41effaf',
    callbackURL: 'http://localhost:3000/user/facebook/return',
    profileFields: ['id', 'emails', 'displayName']
  },
  function(accessToken, refreshToken, profile, done) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    user.findOne({ facebookid: profile.id }, function(err, users) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && users !== null) {
        let ticket = {
          id: users._id,
          name: users.name,
          role: users.role
        };
        // create a token string
        let token = jwt.sign(ticket, jwtSecret);

        return done(null, token);
      } else {
        user.create({
          "facebookid" : profile.id,
          "name" : profile.displayName,
          "email": profile.emails[0].value,
          "photo": '',
          "phone": '',
          "sex": '',
          "age": '',
          "role": '1'
        }, function (err, users) {
          if (err) {
            console.log(err);
          } else {
            let ticket = {
              id: users._id,
              name: users.name,
              role: users.role
            };
            // create a token string
            let token = jwt.sign(ticket, jwtSecret);

            return done(null, token);
          }
        });
      }
    });
  });
};