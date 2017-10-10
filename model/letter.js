// _id: letter id
// cid: clinic id
// content: the newletter send by clinic founder
// createdAt: the message create time
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var letterSchema = new mongoose.Schema({
  cid: {type: Schema.Types.ObjectId, ref: 'Clinic'},
  content: String,
}, {
	timestamps: { "createdAt": 'created_at' }
});
mongoose.model('Letter', letterSchema, 'letter');
