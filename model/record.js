//_id: transaction record id
//uid: user id
//cid: clinic id
//day: the using power day
//price: the buying price
//createdAt: the time when user apply for join

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var recordSchema = new mongoose.Schema({ 
  cid: {type: Schema.Types.ObjectId, ref: 'Clinic'},
  uid: {type: Schema.Types.ObjectId, ref: 'User'},
  day: Number,
  price: Number
}, { 
	timestamps: { "createdAt": 'created_at' }
});
mongoose.model('Record', recordSchema, 'record');