//_id: doctor id
//uid: user id
//info: doctor information
/*
{
	pro,
	exp,
  dep
}
//pro: the professional skill of the doctor
//exp: the experience of the doctor past
//dep: the department of medicine
*/
//clinic: the clinic user working
/*
{
	_id,
	no
}
//_id: clinic id
//no: the current number about doctor working progress in the specific clinic
*/
//createdAt: the time when user upgrade to doctor
//updatedAt: the last time when user updated the information

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var doctorSchema = new mongoose.Schema({ 
  uid: {type: String, ref: 'User'},
  info: {
  	pro: [],
  	exp: [],
    dep: "",
  },
  clinic: [{
  	_id: {type: Schema.Types.ObjectId, ref: 'Clinic'},
  	no: String
  }],
  found: [{type: Schema.Types.ObjectId, ref: 'Clinic'}]
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Doctor', doctorSchema, 'doctor');