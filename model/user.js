//_id: user id
//email: user email
//password: user authenticate password
//facebookid: user facebook id (use for facebook login)
//photo: user profile photo
//phone: user cellphone
//sex: the user gender
//age: the user age
//name: user name
//role: user role(1.user/2.doctor/3.staff/4.manager)
//auth: user account authenticating status
//token: the email token of the account
//clinic: the clinics which user have a duty(clinic id in array)
//createdAt: the time when user created
//updatedAt: the last time when user updated

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new mongoose.Schema({ 
  email: String,
  password: String,
  facebookid: Number,
  photo: String,
  phone: String,
  sex: String,
  age: String,
  name: String,
  role: String,
  auth: String,
  token: String
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('User', userSchema, 'user');



