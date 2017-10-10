//id: reservation data self no
//cid: clinic id
//uid: user id
//no: the number of user waiting ticket
//status: the reservation status(wait/reserve/pass/break/finish)
//createdAt: the time when user ask for reservation
//updatedAt: the time when administration staff set the user waiting ticket number

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autopopulate = require('mongoose-autopopulate');
var reservationSchema = new mongoose.Schema({  
  cid: {type: Schema.Types.ObjectId, ref: 'Clinic', autopopulate: true},
  uid: {type: Schema.Types.ObjectId, ref: 'User', autopopulate: { select: 'name' }},
  no: String,
  status: {type: String, default: 'wait'}
}, { 
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
reservationSchema.plugin(autopopulate);
mongoose.model('Reservation', reservationSchema, 'reservation');