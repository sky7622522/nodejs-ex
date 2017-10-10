//_id: schedule data self no
//cid: clinic id
//name: the schedule(format: year/month)
//content: the information of clinic doctor duty status per month
/*
{
	date,
	morning,
	afternoon,
	night
}
//the date of the schedule
//the duty doctor list of the clinic in the morning
//the duty doctor list of the clinic in the afternoon
//the duty doctor list of the clinic at night
*/
//status: the schedule status(current/outdated)
//createdAt: the time when schedule create
//updatedAt: the time when schedule update

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var content = mongoose.Schema({
    date: String,
    morning: [{type: Schema.Types.ObjectId, ref: 'User'}],
    afternoon: [{type: Schema.Types.ObjectId, ref: 'User'}],
    night: [{type: Schema.Types.ObjectId, ref: 'User'}]
},{ _id : false });
var scheduleSchema = new mongoose.Schema({ 
  'cid': {type: Schema.Types.ObjectId, ref: 'Clinic'},
  'name': String,
  'content': [content],
  'status': {type: String, default: 'current'}
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Schedule', scheduleSchema, 'schedule');