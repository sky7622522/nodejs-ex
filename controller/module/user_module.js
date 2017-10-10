var validator = require('validator'),
    bcrypt = require('bcrypt-nodejs'),
    nodemailer = require('nodemailer'),
    jwt = require('jsonwebtoken'),
    jwtSecret = 'the new taiwan power',
    passport = require('passport'),
    user = require('mongoose').model('User'),
    clinic = require('mongoose').model('Clinic'),
    doctor = require('mongoose').model('Doctor'),
    schedule = require('mongoose').model('Schedule');

var func = function () {};

/*validate the sign up form*/
func.prototype.valCForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let email = payload.email;
  let name = payload.name;
  let password = payload.password

  if (!email || !validator.isEmail(email)) {
    isFormValid = false;
    errors.email = "請輸入有效的信箱";
  }

  if (!name || name.trim().length === 0) {
    isFormValid = false;
    errors.name = "請輸入姓名";
  }

  if (!password || password.trim().length === 0) {
    isFormValid = false;
    errors.password = "請輸入密碼";
  }

  if (!isFormValid) {
    message = "資料輸入有誤";
    cb({
      message: message,
      errors: errors
    });
  } else {
    cb(null, payload);
  }
};

/*check if email exit*/
func.prototype.cMail = function (payload, cb) {
  let email = payload.email;

  user.find( {"email": email}, function(err, users) {
    if (err) {
      cb({
        message: "主機無法回應"
      });
    } else if(users.length) {
      let errors = {};
      errors.email = "信箱重複使用";
      cb({
        message: '資料輸入錯誤',
        errors: errors
      });
    } else {
      cb(null, payload);
    }
  });
};

/*encryptograph password and create user to database*/
func.prototype.cUser = function (payload, cb) {
  let email = payload.email;
  let name = payload.name;
  let password = payload.password;

  bcrypt.genSalt(10, function(err, salt) {
    if(err) {
      cb({ message: '加密錯誤' });
    }
    bcrypt.hash(password, salt, null, function(err, hash) {
      if(err) {
        cb({ message: '加密錯誤' });
      }

      let role = '1';
      let auth = '1';

      user.create({
        "email": email,
        "password" : hash,
        "photo": '',
        "phone": '',
        "sex": '',
        "age": '',
        "name" : name,
        "role": role,
        "auth": auth,
        "token": salt
      }, function (err, users) {
        if (err) {
          cb({
            message: '新增錯誤'
          })
        } else {
          cb(null, { message: '建立成功', user: users })
        }
      });
    });
  });
};

/*send authentic mail to user*/
func.prototype.sMail = function (payload, cb) {
  let name = payload.user.name;
  let authmail = 'https://clinicelephant-talenttrio.rhcloud.com/authentication';
  let id = payload.user._id;
  let token = payload.user.token;
  let email = payload.user.email;

  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'imsmtpserver@gmail.com',
      pass: 'mailrobot357'
    }
  });

  let html = '<p>哈囉~ ' + name + ',</p>' +
             '<p>希望你/妳會喜歡我們的服務!</p>' +
             '<p>如果有不滿意的地方，就到我們官方網站用最直接了當的方式開罵吧!</p>' +
             '<p>最後記得點擊<a href="' + authmail + '?id=' + id + '&&auth=' + token + '">這裡</a>驗證信箱哦~';

  let mailOptions = {
    from: 'imsmtpserver@gmail.com', // sender address
    to: email, // list of receivers
    subject: 'Clinic Elephant 認證信', // Subject line
    html: html
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      cb({
        message: '信件無法寄出'
      })
    }else{
      cb(null, { message: '建立成功' })
    };
  });
};

/*authenticate the email address of account*/
func.prototype.auth = function (payload, cb) {
  let id = payload.id;
  let auth = payload.auth;

  user.findOneAndUpdate( {"_id": id, "token": auth}, {$set: {auth: '1'}}, function(err, users) {
    if (err) {
      cb({ message: "主機無法回應" });
    } else if(users != null) {
      let ticket = {
        id: users._id,
        name: users.name,
        role: users.role
      };
      // create a token string
      let token = jwt.sign(ticket, jwtSecret);
      cb(null, { message: "登入成功", token: token });
    } else {
      //user isn't exist
      cb({ message: "驗證失敗" });
    }
  });
};

/*validate the login form*/
func.prototype.valLForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let email = payload.email;
  let password = payload.password;

  if (!email || email.trim().length === 0) {
    isFormValid = false;
    errors.email = "請輸入有效的信箱";
  }

  if (!password || password.trim().length === 0) {
    isFormValid = false;
    errors.password = "請輸入密碼";
  }

  if (!isFormValid) {
    message = "資料輸入有誤";
    cb({
      message: message,
      errors: errors
    });
  } else {
    cb(null);
  }
};

/*use email and password login*/
func.prototype.login = function (req, res, cb) {
  passport.authenticate('local-login', function(err, token) {
    if (err) {
      console.log(err)
      if (err.name === "error") {
        return res.status(400).json({ message: err.message });
      } else if(err === 'Incorrect arguments') {
        return res.status(400).json({ message: "帳號不存在" });
      }
      return res.status(400).json({ message: "主機無法回應" });
    }
    return res.status(200).json({ message: "登入成功", token: token });

  })(req, res, cb);
}

/*find all clinic data(_id name tel type)*/
func.prototype.allClinic = function (cb) {
  clinic.find({deadline: {"lte": new Date()}}, '_id name tel type', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      cb( null, { "empty": false, "message": clinics } );
    } else {
      cb( null, { "empty": true } );
    }
  });
}

/*find list of specific clinic data(_id name type loc info)*/
func.prototype.clinicList = function (payload, cb) {
  let con = {};
  let name = payload.name || "";
  let city = payload.city || "";
  let dis = payload.district || "";
  let type = payload.type || "";

  if(name) con["name"] = new RegExp(name, "i");
  if(city) con["loc.city"] = new RegExp(city, "i");
  if(dis) con["loc.dis"] = new RegExp(dis, "i");
  if(type) con["type"] = new RegExp(type, "i");
  con["deadline"] = {"$gte": new Date()};
  clinic.find(con, '_id name type loc logo', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      cb( null, clinics );
    } else {
      cb( null, [] );
    }
  });
}

/*show the clinic detail*/
func.prototype.cDetail = function (payload, cb) {
  let cid = payload;
  clinic.findOne({_id: cid}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      let address = clinics.loc.city+clinics.loc.dis+clinics.loc.addr;
      let rTel = clinics.info.rTel;
      let aTel = clinics.info.aTel;
      let des = clinics.info.des;
      let blog = clinics.info.blog;
      let time = clinics.info.time;
      let service = clinics.info.service;
      let equip = clinics.info.equip.map((e) => ({"name": e, "description": "", "img": ""}));
      let photo = clinics.pic.map((p) => ({"name": "", "img": p}));
      let message = {
        "about": {
          "information": [
            {
              "name": "地址",
              "value": address
            },
            {
              "name": "預約電話",
              "value": rTel
            },
            {
              "name": "藥物諮詢電話",
              "value": aTel
            }
          ],
          "introduction": des,
          "news": blog,
          "schedule": [
            {
              "period": "早上",
              "start": time.morning.substring(0,5),
              "end": time.morning.substring(6)
            },
            {
              "period": "下午",
              "start": time.afternoon.substring(0,5),
              "end": time.afternoon.substring(6)
            },
            {
              "period": "晚上",
              "start": time.night.substring(0,5),
              "end": time.night.substring(6)
            }
          ],
          "photo": photo
        },
        "service": service,
        "equipment": equip
      };
      cb( null, message );
    } else {
      cb( {"message": '該診所不存在'} );
    }
  });
}

/*list all doctor in specific clinic*/
func.prototype.dList = function (payload, cb) {
  let cid = payload;
  clinic.findOne({_id: cid}, '_id doctor', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null){
      cb( null, clinics );
    } else {
      cb( {"message": '找不到診所'} );
    }
  });
}

/*show all doctor information detail in specific clinic*/
func.prototype.dDetail = function (payload, cb) {
  let did = payload.doctor;
  let cid = payload._id;
  doctor.find({"uid": {"$in": did}}, '_id uid info clinic').populate({path: 'uid', select: 'name photo'}).exec(function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      let now = new Date();
      let name = now.toISOString().slice(0, 7);
      schedule.findOne({"cid": cid, "name": name}, 'content', function(err, schedules) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else if(schedules && schedules.content && schedules.content.length > 0) {
          clinic.findById(cid, 'info', function(err, clinics) {
            if(err) {
              cb( {"message": '主機無法回應'} );
            } else {
              let time = now.getHours();
              let date = now.toISOString().slice(0, 10);
              let mor = clinics.info.time.morning;
              let aft = clinics.info.time.afternoon;
              let nig = clinics.info.time.night;
              for(let i=0; i<doctors.length; i++) {
                doctors[i].clinic = doctors[i].clinic.filter((d) => d._id.toString() == cid);
                schedules.content = schedules.content.filter((s) => s.date.toString() == date);
                let state = "";
                if(time >= parseInt(mor.slice(0, 2)) && time <= parseInt(mor.slice(6, 8))) {
                  state = (schedules.content[0].morning.indexOf(doctors[i].uid._id) > -1) ? "看診中" : "未看診";
                } else if(time >= parseInt(aft.slice(0, 2)) && time <= parseInt(aft.slice(6, 8))) {
                  state = (schedules.content[0].afternoon.indexOf(doctors[i].uid._id) > -1) ? "看診中" : "未看診";
                } else if(time >= parseInt(nig.slice(0, 2)) && time <= parseInt(nig.slice(6, 8))) {
                  state = (schedules.content[0].night.indexOf(doctors[i].uid._id) > -1) ? "看診中" : "未看診";
                } else {
                  state = "未看診";
                }
                doctors[i].state = state;
                doctors[i].light = doctors[i].clinic[0].no;
              }
              let message = doctors.map((d) => ({"did": d._id, "name": d.uid.name, "pro": d.info.pro, "exp": d.info.exp, "photo": d.uid.photo, "light": d.light, "state": d.state}));
              cb( null, message );
            }
          });
        } else {
          for(let i=0; i<doctors.length; i++) {
            doctors[i].state = "未看診";
            doctors[i].light = doctors[i].clinic[0].no;
          }
          let message = doctors.map((d) => ({"did": d._id, "name": d.uid.name, "pro": d.info.pro, "exp": d.info.exp, "photo": d.uid.photo, "light": d.light, "state": d.state}));
          cb( null, message );
        }
      });
    }
  });
}

/*show the doctor detail*/
func.prototype.doctor = function (payload, cb) {
  let cid = payload.cid;
  let did = payload.did;
  doctor.findOne({"_id": did, "clinic._id": cid}, 'uid info clinic').populate({path: 'uid', select: 'name photo'}).exec(function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(doctors != null) {
      cb( null, { "message": {
                  "name": doctors.uid.name,
                  "img": doctors.uid.photo,
                  "no": doctors.clinic[0].no,
                  "pro": doctors.info.pro,
                  "exp": doctors.info.exp
      } } );
    } else {
      cb( {"message": '該診所不存在'} );
    }
  });
};

/*list all doctor number of the specific clinic*/
func.prototype.nList = function (payload, cb) {
  let cid = payload.cid;
  let did = payload.did;
  doctor.findById(did, 'uid clinic', function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if (doctors != null){
      let now = new Date();
      let name = now.toISOString().slice(0, 7);
      schedule.findOne({"cid": cid, "name": name}, 'content', function(err, schedules) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else if(schedules && schedules.content && schedules.content.length > 0) {
          clinic.findById(cid, 'info', function(err, clinics) {
            if(err) {
              cb( {"message": '主機無法回應'} );
            } else {
              let time = now.getHours();
              let date = now.toISOString().slice(0, 10);
              let mor = clinics.info.time.morning;
              let aft = clinics.info.time.afternoon;
              let nig = clinics.info.time.night;
              doctors.clinic = doctors.clinic.filter((d) => d._id == cid);
              schedules.content = schedules.content.filter((s) => s.date.toString() == date);
              let state = "";
              if(time >= parseInt(mor.slice(0, 2)) && time <= parseInt(mor.slice(6, 8))) {
                state = (schedules.content[0].morning.indexOf(doctors.uid) > -1) ? "看診中" : "未看診";
              } else if(time >= parseInt(aft.slice(0, 2)) && time <= parseInt(aft.slice(6, 8))) {
                state = (schedules.content[0].afternoon.indexOf(doctors.uid) > -1) ? "看診中" : "未看診";
              } else if(time >= parseInt(nig.slice(0, 2)) && time <= parseInt(nig.slice(6, 8))) {
                state = (schedules.content[0].night.indexOf(doctors.uid) > -1) ? "看診中" : "未看診";
              } else {
                state = "未看診";
              }
              let message = {"state": state, "light": doctors.clinic[0].no};
              cb( null, message );
            }
          });
        } else {
          console.log(doctors);
          let message = {"state": "未看診", "light": doctors.clinic[0].no};
          cb( null, message );
        }
      });
    } else {
      cb( {"message": '找不到醫師'} );
    }
  });
};

/*get the specific date of the specific clinic schedule*/
func.prototype.schedule = function (payload, cb) {
  var cid = payload.cid;
  var name = payload.title;
  var start = payload.date;
  start = new Date(start);
  var d = start.toISOString().slice(0, 10);
  schedule.findOne({"cid": cid, "name": name}, '_id content').populate({path: 'content.morning', select: 'name photo'}).populate({path: 'content.afternoon', select: 'name photo'}).populate({path: 'content.night', select: 'name photo'}).exec( function(err, schedules) {
    if(err) {
      console.log(err);
      cb( {"message": '主機無法回應'} );
    } else if(schedules != null) {
      let sch = schedules.content.filter((s) => s.date == d);
      /*let mor = sch[0].morning.map((m) => m.name);
      let aft = sch[0].afternoon.map((a) => a.name);
      let nig = sch[0].night.map((n) => n.name);*/
      if(sch == null || sch[0] == null) {
        cb( null, {"morning": [], "afternoon": [], "night": []});
      } else {
        cb( null, {"morning": sch[0].morning, "afternoon": sch[0].afternoon, "night": sch[0].night});  
      }      
    } else {
      cb( {"message": '該班表不存在'} );
    }
  })
};

module.exports = new func();