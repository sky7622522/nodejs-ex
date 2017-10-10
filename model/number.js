//_id: clinic room id
//cid: clinic id
//room: room number
//no: registered number
//createdAt: the first time when machine connect with server
//updatedAt: the last time when registered number come

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var numberSchema = new mongoose.Schema({ 
  cid: {type: Schema.Types.ObjectId, ref: 'Clinic'},
  room: Number,
  no: String
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Number', numberSchema, 'number');