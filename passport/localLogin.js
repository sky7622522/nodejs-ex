var passport = require('passport'),
		bcrypt = require('bcrypt-nodejs'),
    mongoose = require('mongoose'),
    jwt = require('jsonwebtoken'),
    jwtSecret = 'the new taiwan power',
		user = mongoose.model('User'),
    doctor = mongoose.model('Doctor'),
		localStrategy = require('passport-local').Strategy;

module.exports = function() {
	//email and password are the request parameter
	return new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false,
    passReqToCallback: true
  }, function(req, email, password, done) {
    let userData = {
      email: email.trim(),
      password: password.trim(),
    };

    // find a user by email address
    user.findOne({email: userData.email}, function(err, users) {
      if (err) { return done(err); }

      if (!users) {
        let error = new Error("帳號不存在");
        error.name = "error";
        return done(error);
      }

      // check if a hashed user's password is equal to a value saved in the database
      bcrypt.compare(userData.password, users.password, function(err, isMatch) {
        if (err) { return done(err); }

        if (!isMatch) {
          let error = new Error("密碼輸入錯誤");
          error.name = "error";
          return done(error);
        }

        let ticket = {
          id: users._id,
          name: users.name,
          role: users.role
        };
        // create a token string
        let token = jwt.sign(ticket, jwtSecret);

        return done(null, token);
      });
    });
  });

};