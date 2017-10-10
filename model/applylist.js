//_id: applylist data self no
//cid: clinic id
//uid: user id
//position: the position user apply for(dcotor/staff)
//status: the applylist status(wait/agree/reject)
//createdAt: the time when user apply for join
//updatedAt: the time when clinic manager response the result

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var applylistSchema = new mongoose.Schema({ 
  cid: {type: Schema.Types.ObjectId, ref: 'Clinic'},
  uid: {type: Schema.Types.ObjectId, ref: 'User'},
  position: String,
  status: {type: String, default: 'wait'}
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Applylist', applylistSchema, 'applylist');