//_id: staff id
//uid: user id
//clinic: the clinic user working
//createdAt: the time when user upgrade to staff
//updatedAt: the last time when user updated the information

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var staffSchema = new mongoose.Schema({ 
  uid: {type: String, ref: 'User'},
  clinic: [{type: Schema.Types.ObjectId, ref: 'Clinic'}]
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Staff', staffSchema, 'staff');