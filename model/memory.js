// _id: memory id
// fid: user facebook id
// longTerm: long term memory using for record user personal information
/*
  name: user name
  fClinic: favorite clinic
  maxServ: the service user using more
*/
// shortTerm: short term memory using for record user current dialog stage
/*
  vClinic: the clinic user visited now
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var memorySchema = new mongoose.Schema({
  fid: String,
  longTerm: {
    name: String,
    fClinic: [String],
    maxServ: String
  },
  shortTerm: {
    vClinic: String
  }
}, {
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Memory', memorySchema, 'memory');
