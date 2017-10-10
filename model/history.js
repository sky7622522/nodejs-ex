// _id: history id
// fid: user facebook id
// action: the action according to user text
// type: the message type
// content: the message content
// createdAt: the message create time
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var historySchema = new mongoose.Schema({
  fid: String,
  type: String,
  action: String,
  content: String,
}, {
	timestamps: { "createdAt": 'created_at' }
});
mongoose.model('History', historySchema, 'history');
