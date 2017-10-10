//_id: clinic id
//name: clinic name
//tel: clinic telephone number
//info: the clinic detail information
/*
{
  rTel,
  aTel,
  time,
  des,
  blog,
  logo,
  pic,
  service,
  equip
}
//rTel: the telephone number for reservation
//aTel: the telephone number for asking question about medicine
//time: the clinic working time
//des: the description of the clinic introduction
//blog: the blog in clinic
//service: the clinic service problem
//equip: the clinic equipment
*/
//letter: the newletter send by clinic founder
//logo: the logo picture of the clinic
//pic: the pictures of the clinic
//type: the type of clinic(Pediatrics/ophthalmology/orthopedics/dentist/Otolaryngology)
//loc: clinic location
/*
{
  city,
  dis,
  addr
}
//city: the city of the clinic location
//dis: the district/township of the clinic location
//addr: the detail loaction(address) of the clinic
*/
//fsche: the week schedule clinic making more often
//doctor: doctors in clinic(user id in array)
//staff: administration staff in clinic(user id in array)
//manager: the clinic manager in clinic
//status: the clinic status(true/false)
//createdAt: the time when clinic created
//updatedAt: the last time when clinic updated

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var content = mongoose.Schema({
    morning: [],
    afternoon: [],
    night: []
},{ _id : false });
var clinicSchema = new mongoose.Schema({
  name: String,
  info: {
    rTel: String,
    aTel: String,
    time: {
      morning: String,
      afternoon: String,
      night: String
    },
    des: String,
    blog: String,
    service: [],
    equip: []
  },
  letter: String,
  logo: String,
  pic: [],
  type: String,
  loc: {
    city: String,
    dis: String,
    addr: String
  },
  fsche: {
    d1: content,
    d2: content,
    d3: content,
    d4: content,
    d5: content,
    d6: content,
    d7: content
  },
  doctor: [{type: Schema.Types.ObjectId, ref: 'User'}],
  staff: [{type: Schema.Types.ObjectId, ref: 'User'}],
  manager: {type: Schema.Types.ObjectId, ref: 'User'},
  deadline: Date
}, {
	timestamps: { "createdAt": 'created_at', "updatedAt": 'updated_at' }
});
mongoose.model('Clinic', clinicSchema, 'clinic');
