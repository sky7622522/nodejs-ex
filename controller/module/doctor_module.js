var formidable = require('formidable'),
    fs = require('fs'),
    path = require('path'),
    mkdir = require('mkdirp'),
    rmdir = require('rimraf'),
    jwt = require('jsonwebtoken'),
    user = require('mongoose').model('User'),
    doctor = require('mongoose').model('Doctor'),
    applylist = require('mongoose').model('Applylist'),
    record = require('mongoose').model('Record'),
    clinic = require('mongoose').model('Clinic'),
    schedule = require('mongoose').model('Schedule'),
    letter = require('mongoose').model('Letter'),
    memory = require('mongoose').model('Memory'),
    number = require('mongoose').model('Number'),
    FacebookBot = require('./messenger_module');

var func = function () {};

/*get all clinic list using for doctor apply*/
func.prototype.getCList = function (payload, cb) {
  let id = payload.member.id;
  let ids = [id];
  clinic.find({ deadline: {"$gte": new Date()}, doctor: {"$nin": ids} }, '_id name type').exec( function(err, clinics) {
    if(err) {
      console.log(err);
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"allClinic": clinics} );
    }
  })
};

/*check if any apply list exit or the applicant is a doctor in applying clinic*/
func.prototype.checkApply = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  applylist.findOne({cid: cid, uid: id}).sort('-created_at').exec( function(err, applylists) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(applylists == null) {
      cb( null, payload );
    } else if(applylists.status === 'reject') {
      cb( null, payload );
    } else {
      cb( {"message": '申請單處理中，或您已經是該診所醫生了'} );
    }
  });
};

/*create the apply list*/
func.prototype.apply = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  let position = '醫生';
  applylist.create({
    cid: cid,
    uid: id,
    position: position
  }, function(err, applylists) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"message": '送出請求，請等候回覆'} );
    }
  });
};

/*list all apply waiting for response*/
func.prototype.getAList = function (payload, cb) {
  let cid = payload.body.cid;
  let status = 'wait';
  applylist.find({"cid": cid, "status": "wait"}, "_id cid uid position").populate( [ { path: 'cid', select: '_id name' }, { path: 'uid', select: '_id name' } ] ).exec(function(err, applylists) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(applylists != null) {
      cb( null, { "applylist": applylists } );
    }
  });
};

/*update the apply status*/
func.prototype.uApply = function (payload, cb) {
  let id = payload.member.id;
  let aid = payload.body.aid;
  let status = payload.body.response;
  if(status == 'reject' || status == 'agree') {
    applylist.findByIdAndUpdate(aid, {$set: {status: status}}, function(err, applylists){
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else if(applylists != null) {
        applylists.status = status;
        cb( null, applylists );
      } else {
        cb( {"message": '該申請單不存在'});
      }
    });
  } else {
    cb( {"message": '不接受該回應'});
  }
};

/*push clinic to doctor's clinic array or staff's clinic array*/
func.prototype.pClinic = function (payload, cb) {
  let uid = payload.uid;
  let cid = payload.cid;
  let pos = payload.position;
  let status = payload.status;
  if(status == 'reject') {
    cb(null, payload);
  } else if(payload.position == '醫生') {
    doctor.findOneAndUpdate({"uid": uid}, {$push: {"clinic": {"_id": cid, "no": "0"}}}, function(err, doctors) {
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else if(doctors != null) {
        cb(null, payload);
      } else {
        cb( {"message": '該醫師不存在'});
      }
    });
  } else if(payload.position == '行政人員') {
    staff.findOneAndUpdate({"uid": uid}, {$push: {"clinic": cid}}, function(err, staffs) {
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else if(staffs != null) {
        cb(null, payload);
      } else {
        cb( {"message": '該行政人員不存在'});
      }
    });
  } else {
    cb( {"message": '資料處理錯誤'} );
  }
};

/*push user to clinic's doctor array or clinic's staff array*/
func.prototype.pUser = function (payload, cb) {
  let uid = payload.uid;
  let cid = payload.cid;
  let pos = payload.position;
  let status = payload.status;
  let newload = {};
  newload.body = {};
  newload.body.cid = cid;
  if(status == 'reject') {
    cb(null, newload);
  } else if(payload.position == '醫生') {
    clinic.findByIdAndUpdate(cid, {$push: {"doctor": uid}}, function(err, clinics) {
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else if(clinics != null) {
        cb(null, newload);
      } else {
        cb( {"message": '該診所不存在'});
      }
    });
  } else if(payload.position == '行政人員') {
    clinic.findByIdAndUpdate(cid, {$push: {"staff": uid}}, function(err, clinics) {
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else if(clinics != null) {
        cb(null, newload);
      } else {
        cb( {"message": '該診所不存在'});
      }
    });
  } else {
    cb( {"message": '資料處理錯誤'} )
  }
};

/*get all clinic user working at*/
func.prototype.wClinic = function (payload, cb) {
  let id = payload;
  let newload = {};
  newload.id = id;
  doctor.findOne({"uid": id}, 'clinic').populate('clinic._id', '_id name').exec( function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(doctors.clinic != null && doctors.clinic.length > 0) {
      let result = [];
      for(let i=0; i<doctors.clinic.length; i++) {
        result.push(doctors.clinic[i]._id)
      }
      newload.clinic = result;
      cb( null, newload );
    } else {
      newload.clinic = [];
      cb( null, newload)
    }
  });
};

/*get all clinic user managing at*/
func.prototype.mClinic = function (payload, cb) {
  let id = payload.id;
  let cln = payload.clinic;
  clinic.find({manager: id}, '_id name', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null && clinics.length > 0) {
      payload.found = clinics;
      cb( null, payload );
    } else {
      payload.found = [];
      cb( null, payload)
    }
  });
};

/*get doctor basic information*/
func.prototype.getBInfo = function (payload, cb) {
  let id = payload.member.id;
  user.findById(id, 'name photo phone sex age', function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      payload.body.name = users.name;
      payload.body.photo = users.photo;
      payload.body.phone = users.phone;
      payload.body.sex = users.sex;
      payload.body.age = users.age;
      cb( null, payload );
    }
  });
};

/*get doctor professional information*/
func.prototype.getPInfo = function (payload, cb) {
  let id = payload.member.id;
  let name = payload.body.name;
  let photo = payload.body.photo;
  let phone = payload.body.phone;
  let sex = payload.body.sex;
  let age = payload.body.age;
  doctor.findOne({uid: id}, 'info', function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, { "name": name,
                  "photo": photo,
                  "phone": phone,
                  "sex": sex,
                  "age": age,
                  "profession": doctors.info.pro,
                  "experience": doctors.info.exp,
                  "department": doctors.info.dep });
    }
  });
};

/*parse the data/form format request*/
func.prototype.parseForm = function (payload, cb) {
  let body = {};
  body['picture'] = [];
  let form = new formidable.IncomingForm();

  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  //read form data except image
  form.on('field', function(field, value) {
    body[field] = value;
  });

  //read form image data
  form.on('file', function(field, file) {
    if(field == 'image') {
      body['image'] = file;
    } else if(field == 'logo') {
      body['logo'] = file;
    } else {
      let c = parseInt(field[7]);
      body['picture'][c] = file;
    }
  });

  form.on('end', function () {
    payload.body = body;
    cb(null, payload);
  });

  form.parse(payload);
}

/*validate the doctor edit information form*/
func.prototype.valEForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let name = payload.body.name;
  let sex = payload.body.sex;
  let age = payload.body.age;
  let pro = payload.body.profession;
  let exp = payload.body.experience;
  let dep = payload.body.department;

  if (!name || name.trim().length === 0) {
    isFormValid = false;
    errors.name = "請輸入姓名";
  }

  if (!sex || sex.trim().length === 0) {
    isFormValid = false;
    errors.sex = "請輸入性別";
  }

  if (!age || age.trim().length === 0) {
    isFormValid = false;
    errors.age = "請輸入年齡";
  } else if (isNaN(age)) {
    isFormValid = false;
    errors.age = "請輸入數字";
  }

  if (!pro || pro.trim().length === 0) {
    isFormValid = false;
    errors.profession = "請輸入專長";
  }

  if (!exp || exp.trim().length === 0) {
    isFormValid = false;
    errors.experience = "請輸入經歷";
  }

  if (!dep || dep.trim().length === 0) {
    isFormValid = false;
    errors.department = "請輸入科別";
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

/*upload the profile photo*/
func.prototype.uploadImage = function (payload, cb) {
  let id = payload.member.id;
  let uploadDir = path.join(__dirname, '../../../data/image/' + id + '/');
  let photo = payload.body.image;
  if(photo) {
    //delete the old image
    rmdir(uploadDir, function(err){
      if(err) console.log(err);
      //create new directory
      mkdir(uploadDir, function(err) {
        if(err) console.log(err);
        //upload the image
        //rename the image with date and image type
        let rightNow = new Date();
        let date = rightNow.toISOString().slice(0,18).replace(/-/g,"").replace(/:/g,"");
        let type = photo.name.split('.')[1];
        let name = date+"."+type;
        let image = path.join(uploadDir, name);
        //fs.rename(photo.path, image);
        let readStream = fs.createReadStream(photo.path);
        let writeStream = fs.createWriteStream(image);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
          fs.unlinkSync(photo.path);
        });
        let imgPath = '/image/'+ id + '/' + name;
        payload.body.photo = imgPath;
        cb( null, payload );
      });
    });
  } else {
    cb( null, payload );
  }
}

/*edit the doctor basic information*/
func.prototype.editBInfo = function (payload, cb) {
  let id = payload.member.id;
  let name = payload.body.name;
  let sex = payload.body.sex;
  let age = payload.body.age;
  let phone = payload.body.phone;
  let photo = payload.body.photo || null;
  let edit = photo ? {name: name, sex: sex, age: age, phone: phone, photo: photo} : {name: name, sex: sex, age: age, phone: phone};

  user.findByIdAndUpdate(id, {$set: edit}, function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, payload );
    }
  });
};

/*edit the doctor professional information*/
func.prototype.editPInfo = function (payload, cb) {
  let id = payload.member.id;
  let pro = payload.body.profession;
  let exp = payload.body.experience;
  let dep = payload.body.department;
  pro = pro.split(',');
  exp = exp.split(',');
  let info = {
    'pro': pro,
    'exp': exp,
    'dep': dep
  };

  doctor.findOneAndUpdate({"uid": id}, {'$set': {'info': info}}, function(err, doctors) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, payload );
    }
  });
};

/*check if doctor working at specific clinic*/
func.prototype.checkDAuth = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  clinic.findOne({_id: cid, "doctor": id}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      cb(null, payload)
    } else {
      cb( {"message": '權限不足，或者診所不存在'} );
    }
  });
};

/*check if the specific clinic manager is user*/
func.prototype.checkMAuth = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  clinic.findOne({_id: cid, "manager": id}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      cb(null, payload)
    } else {
      cb( {"message": '權限不足，或者診所不存在'} );
    }
  });
};

/*close uploading number mechanism connect to specific doctor*/
func.prototype.cNumber = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  doctor.findOneAndUpdate({"uid": id, "clinic._id": cid}, {"clinic.$.no": "0"}, function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"no": "0"} );
    }
  });
};

/*update the doctor number in specific clinic*/
func.prototype.uNumber = function (payload, cb) {
  let id = payload.member.id;
  let room = payload.body.room;
  let cid = payload.body.cid;
  number.findOne({"cid": cid, "room": room}, function(err, numbers) {
    if(err || !numbers || Object.getOwnPropertyNames(numbers).length === 0) {
      cb( {"message": '連線失敗'} );
    } else {
      let no = isNaN(numbers.no) ? "0" : numbers.no;
      doctor.findOneAndUpdate({"uid": id, "clinic._id": cid}, {"clinic.$.no": no}, function(err, doctors) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else {
          cb( null, {"no": no} );
        }
      });
    }
  })
    
};

/*setting specific clinic upload number environment*/
func.prototype.sNumber = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  let room = payload.body.room;
  number.findOneAndUpdate(
    {
      cid: cid,
      room: room
    },
    {
      "$setOnInsert": {
        cid: cid,
        room: room
      }
    },
    { upsert: true, new: true },
    function(err, numbers) {
    if(err) {
      cb({"message": '主機無法回應'});
    } else {
      let token = jwt.sign({id: numbers._id}, 'the new taiwan power');
      cb(null, {token: token});
    }
  });
};

/*get clinic information from specific clinic*/
func.prototype.getCInfo = function (payload, cb) {
  let id = payload.member.id;
  let cid = payload.body.cid;
  clinic.findById(cid, '_id name info logo pic type loc deadline', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"name": clinics.name,
                 "rNumber": clinics.info.rTel,
                 "aNumber": clinics.info.aTel,
                 "morning": clinics.info.time.morning,
                 "afternoon": clinics.info.time.afternoon,
                 "night": clinics.info.time.night,
                 "description": clinics.info.des,
                 "blog": clinics.info.blog,
                 "logo": clinics.logo,
                 "picture": clinics.pic,
                 "service": clinics.info.service,
                 "equipment": clinics.info.equip,
                 "type": clinics.type,
                 "city": clinics.loc.city,
                 "district": clinics.loc.dis,
                 "address": clinics.loc.addr,
                 "deadline": clinics.deadline.toISOString().slice(0, 10)} );
    }
  });
};

/*create a default clinic for user paid for*/
func.prototype.create = function (payload, cb) {
  let id = payload.member.id;
  let day = parseInt(payload.body.day);
  let now = new Date();
  let date = new Date();
  date.setDate(now.getDate()+day);

  clinic.create({
    name: '預設名稱',
    info: {
      rTel: '',
      aTel: '',
      time: {
        morning: '08:00~12:00',
        afternoon: '13:00~17:00',
        night: '19:00~22:00'
      },
      des: '描述診所目前狀況',
      blog: '',
      service: [],
      equip: []
    },
    logo: '',
    pic: [],
    type: '',
    loc: {
      city: '台中市',
      dis: '南區',
      addr: ''
    },
    doctor: [id],
    staff: [],
    manager: [id],
    deadline: date
  }, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {id: id, cid: clinics._id, day: day});
    }
  });
};

/*create a default clinic for user paid for*/
func.prototype.cRecord = function (payload, cb) {
  let id = payload.id;
  let cid = payload.cid;
  let day = parseInt(payload.day);
  let price = (day == 30) ? 1200 : (day == 180) ? 6000 : 10000;
  record.create({cid: cid, uid: id, day: day, price: price}, function(err, records){
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, payload);
    }
  })
};

/*add a clinic to founder's clinic list*/
func.prototype.addClinic = function (payload, cb) {
  let id = payload.id;
  let cid = payload.cid;
  doctor.findOneAndUpdate({"uid": id}, {$push: {"clinic": {"_id": cid, "no": "0"}, "found": cid}}, function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"message": '新增完成'} );
    }
  });
};

/*validate the clinic update form*/
func.prototype.valCForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let name = payload.body.name;
  let service = payload.body.service;
  let type = payload.body.type;
  let city = payload.body.city;
  let district = payload.body.district;
  let address = payload.body.address;

  let validCity = [ '台北市', '新北市', '桃園市', '台中市', '台南市',
                    '高雄市', '基隆市', '新竹市', '嘉義市', '新竹縣',
                    '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
                    '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣',
                    '金門縣', '連江縣'];
  let validDistrict = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區',
    '北投區', '內湖區', '南港區', '文山區', '板橋區', '新莊區', '中和區', '永和區',
    '土城區', '樹林區', '三峽區', '鶯歌區', '三重區', '蘆洲區', '五股區', '泰山區',
    '林口區', '淡水區', '金山區', '八里區', '萬里區', '石門區', '三芝區', '瑞芳區',
    '汐止區', '平溪區', '貢寮區', '雙溪區', '深坑區', '石碇區', '新店區', '坪林區',
    '烏來區', '桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區',
    '龍潭區', '龜山區', '大園區', '觀音區', '新屋區', '復興區', '中區', '東區',
    '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區',
    '霧峰區', '烏日區', '豐原區', '后里區', '石岡區', '東勢區', '和平區', '新社區',
    '潭子區', '神岡區', '大雅區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區',
    '大甲區', '外埔區', '大安區', '中西區', '安平區', '安南區', '永康區', '歸仁區',
    '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區',
    '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區',
    '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區',
    '善化區', '大內區', '山上區', '新市區', '安定區', '楠梓區', '左營區', '鼓山區',
    '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '旗津區', '小港區',
    '鳳山區', '大寮區', '鳥松區', '林園區', '仁武區', '大樹區', '大社區', '岡山區',
    '路竹區', '橋頭區', '梓官區', '彌陀區', '永安區', '燕巢區', '田寮區', '阿蓮區',
    '茄萣區', '湖內區', '旗山區', '美濃區', '內門區', '杉林區', '甲仙區', '六龜區',
    '茂林區', '桃源區', '那瑪夏區', '仁愛區', '中正區', '信義區', '中山區', '安樂區',
    '暖暖區', '七堵區', '香山區', '竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉',
    '新豐鄉', '峨眉鄉', '寶山鄉', '北埔鄉', '芎林鄉', '橫山鄉', '尖石鄉', '五峰鄉',
    '苗栗市', '頭份市', '卓蘭鎮', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '造橋鄉',
    '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉',
    '南庄鄉', '泰安鄉', '彰化市', '員林市', '和美鎮', '鹿港鎮', '溪湖鎮', '二林鎮',
    '田中鎮', '北斗鎮', '花壇鄉', '芬園鄉', '大村鄉', '永靖鄉', '伸港鄉', '線西鄉',
    '福興鄉', '秀水鄉', '埔心鄉', '埔鹽鄉', '大城鄉', '芳苑鄉', '竹塘鄉', '社頭鄉',
    '二水鄉', '田尾鄉', '埤頭鄉', '溪州鄉', '南投市', '埔里鎮', '草屯鎮', '竹山鎮',
    '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉',
    '仁愛鄉', '斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '林內鄉',
    '古坑鄉', '大埤鄉', '莿桐鄉', '褒忠鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '臺西鄉',
    '東勢鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉', '太保市', '朴子市', '布袋鎮',
    '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉',
    '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉', '屏東市',
    '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉',
    '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '竹田鄉', '新埤鄉', '枋寮鄉', '新園鄉',
    '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋山鄉',
    '霧臺鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉', '三地門鄉',
    '宜蘭市', '頭城鎮', '羅東鎮', '蘇澳鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉',
    '五結鄉', '三星鄉', '大同鄉', '南澳鄉', '花蓮市', '鳳林鎮', '玉里鎮', '新城鄉',
    '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉',
    '卓溪鄉', '臺東市', '成功鎮', '關山鎮', '長濱鄉', '池上鄉', '東河鄉', '鹿野鄉',
    '卑南鄉', '大武鄉', '綠島鄉', '太麻里鄉', '海端鄉', '延平鄉', '金峰鄉', '達仁鄉',
    '蘭嶼鄉', '馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉', '金城鎮',
    '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉', '南竿鄉', '北竿鄉', '莒光鄉',
    '東引鄉'];

  if (!name || name.trim().length === 0) {
    isFormValid = false;
    errors.name = "請輸入診所名稱";
  }

  if (!service || service.trim().length === 0) {
    isFormValid = false;
    errors.service = "請輸入服務項目";
  }

  if (!type || type.trim().length === 0) {
    isFormValid = false;
    errors.type = "請輸入診所類型";
  }

  if (!city || city.trim().length === 0) {
    isFormValid = false;
    errors.city = "請輸入診所所在城市";
  } else if (validCity.indexOf(city.trim()) < 0) {
    isFormValid = false;
    errors.city = "請輸入精確的城市名稱";
  }

  if (!district || district.trim().length === 0) {
    isFormValid = false;
    errors.district = "診所所在行政區/鄉鎮";
  } else if (validDistrict.indexOf(district.trim()) < 0) {
    isFormValid = false;
    errors.district = "請輸入精確的行政區/鄉鎮名稱";
  }

  if (!address || address.trim().length === 0) {
    isFormValid = false;
    errors.address = "診所所在地址";
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

/*upload the clinic logo*/
func.prototype.uploadLogo = function (payload, cb) {
  let id = payload.body.cid;
  let uploadDir = path.join(__dirname, '../../../data/logo/' + id + '/');
  let photo = payload.body.logo;
  if(photo) {
    //delete the old image
    rmdir(uploadDir, function(err){
      if(err) console.log(err);
      //create new directory
      mkdir(uploadDir, function(err) {
        if(err) console.log(err);
        //upload the image
        //rename the image with date and image type
        let rightNow = new Date();
        let date = rightNow.toISOString().slice(0,18).replace(/-/g,"").replace(/:/g,"");
        let type = photo.name.split('.')[1];
        let name = date+"."+type;
        let image = path.join(uploadDir, name);
        //fs.rename(photo.path, image);
        let readStream = fs.createReadStream(photo.path);
        let writeStream = fs.createWriteStream(image);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
          fs.unlinkSync(photo.path);
        });
        let imgPath = '/logo/'+ id + '/' + name;
        payload.body.logos = imgPath;
        cb( null, payload );
      });
    });
  } else {
    cb( null, payload );
  }
}

/*upload the clinic picture*/
func.prototype.uploadPicture = function (payload, cb) {
  let id = payload.body.cid;
  let uploadDir = path.join(__dirname, '../../../data/picture/' + id + '/');
  let photo = payload.body.picture;
  if(photo.length > 0) {
    mkdir(uploadDir, function(err) {
      if(err) console.log(err);
      let all = [];
      for(let i=0; i<photo.length; i++) {
        //upload the image
        //rename the image with date and image type
        let rightNow = new Date();
        let date = rightNow.toISOString().slice(0,18).replace(/-/g,"").replace(/:/g,"");
        let type = photo[i].name.split('.')[1];
        let name = date+i+"."+type;
        let image = path.join(uploadDir, name);
        //fs.rename(photo[i].path, image);
        let readStream = fs.createReadStream(photo[i].path);
        let writeStream = fs.createWriteStream(image);
        readStream.pipe(writeStream);
        readStream.on('end',function(){
          fs.unlinkSync(photo[i].path);
        });
        let imgPath = '/picture/'+ id + '/' + name;
        all.push(imgPath);
      }
      payload.body.pictures = all;
      cb( null, payload );
    });
  } else {
    cb( null, payload );
  }
}

/*update the clinic information*/
func.prototype.updateClinic = function (payload, cb) {
  let cid = payload.body.cid;
  let update = {};
  let name = payload.body.name;
  update['name'] = name;
  let rTel = payload.body.rNumber;
  let aTel = payload.body.aNumber;
  let mTime = payload.body.morning;
  let aTime = payload.body.afternoon;
  let nTime = payload.body.night;
  let time = {
    'morning': mTime,
    'afternoon': aTime,
    'night': nTime
  };
  let des = payload.body.description;
  let blog = payload.body.blog;
  let service = payload.body.service.split(',').filter(e => e != '');
  let equip = payload.body.equipment.split(',').filter(e => e != '');
  let info = {
    'rTel': rTel,
    'aTel': aTel,
    'time': time,
    'des': des,
    'blog': blog,
    'service': service,
    'equip': equip
  }
  let logo = payload.body.logos || null;
  if(logo) update['logo'] = logo;
  update['info'] = info;
  let type = payload.body.type;
  update['type'] = type;
  let city = payload.body.city;
  let dis = payload.body.district;
  let addr = payload.body.address;
  let loc = {
    'city': city,
    'dis': dis,
    'addr': addr
  };
  update['loc'] = loc;
  clinic.findByIdAndUpdate(cid, {$set: update}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, payload );
    }
  });
};

/*update the clinic information*/
func.prototype.updatePicture = function (payload, cb) {
  let pic = payload.body.pictures || null;
  let cid = payload.body.cid;
  if(pic) {
    clinic.findByIdAndUpdate(cid, {$push: {'pic': {$each: pic}}}, function(err, clinics) {
      if(err) {
        cb( {"message": '主機無法回應'} );
      } else {
        cb( null, payload );
      }
    });
  } else {
    cb( null, payload );
  }
};

/*get the deadline of the clinic*/
func.prototype.cdeadline = function (payload, cb) {
  let cid = payload.body.cid;
  let day = payload.body.day;
  let id = payload.member.id;
  clinic.findById(cid, '_id deadline', function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"id": id, "cid": cid, "day": day, "deadline": clinics.deadline} );
    }
  });
};

/*extend the clinic deadline*/
func.prototype.extendClinic = function (payload, cb) {
  let cid = payload.cid;
  let day = parseInt(payload.day);
  let deadline = payload.deadline;
  let now = new Date();
  if(deadline.getTime() > now.getTime()) {
    date = new Date(deadline);
    date.setDate(date.getDate()+day);
  } else {
    date = new Date(now);
    date.setDate(now.getDate()+day);
  }
  clinic.findByIdAndUpdate(cid, {$set: {deadline: date}}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"deadline": date.toISOString().slice(0, 10)} );
    }
  });
};

/*edit the new letter in clinic table*/
func.prototype.eLetter = function (payload, cb) {
  let cid = payload.body.cid;
  let content = payload.body.letter;
  clinic.findByIdAndUpdate(cid, {$set: {letter: content}}, function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"cid": cid, "letter": content} );
    }
  });
};

/*create the new letter in letter table*/
func.prototype.cLetter = function (payload, cb) {
  let cid = payload.cid;
  let content = payload.letter;
  letter.create({
    'cid': cid,
    'content': content
  }, function(err, letters) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"cid": cid, "letter": content} );
    }
  });
};

/*release the new letter to */
func.prototype.rLetter = function (payload, cb) {
  let cid = payload.cid;
  let content = payload.letter;
  memory.find({"shortTerm.vClinic": cid}, function(err, memories) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(memories.length > 0) {
      let fb = new FacebookBot();
      for(let i=0; i<memories.length; i++) {
        fb.doRichContentResponse(memories[i].fid, [{ 'type': 0,
          'speech': content
        }]);
      }
      cb( null, {"message": '發佈完成'} );
    } else {
      cb( null, {"message": '發佈完成'} );
    }
  });
};

/*create clinic schedule*/
func.prototype.cSchedule = function (payload, cb) {
  let cid = payload.body.cid;
  let name = payload.body.name;
  let year = parseInt(name.slice(0,4));
  let mon = parseInt(name.slice(5));
  let days = new Date(year, mon, 0).getDate();
  let content = [];
  mon--;
  for(let i=1; i<=days; i++){
    let date = new Date(year, mon, i).toISOString().slice(0, 10);
    content.push({"date": date, "morning": [], "afternoon": [], "night": []});
  }
  schedule.create({
    'cid': cid,
    'name': name,
    'content': content
  }, function(err, schedules) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, {"message": '新增完成'} );
    }
  });
}

/*get the specific clinics schedule list*/
func.prototype.gSList = function (payload, cb) {
  let id = payload.id;
  let cln = payload.clinic;
  let found = payload.found;
  let clinics = [];
  let scd = [];
  for(let i=0; i<cln.length; i++){
    clinics[i] = cln[i]._id.toString();
    scd[i] = {
      'cid': cln[i]._id,
      'name': cln[i].name,
      'schedule': []
    };
  }
  schedule.find({'cid': {"$in": cln}, 'status': 'current'}, '_id cid name', function(err, schedules) {
    for(let i=0; i<schedules.length; i++){
      scd[clinics.indexOf(schedules[i].cid.toString())].schedule.push({
        'sid': schedules[i]._id,
        'name': schedules[i].name
      });
    }
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, { "clinic": cln, "found": found, "schedule": scd} );
    }
  });
}

/*list all doctor and often making schedule in the specific clinic*/
func.prototype.gDList = function (payload, cb) {
  let cid = payload.body.cid;
  clinic.findById(cid, 'doctor fsche').populate({ path: 'doctor', select: '_id name' }).exec(function(err, clinics) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(clinics != null) {
      payload.doctors = clinics.doctor;
      payload.fsche = clinics.fsche;
      cb( null, payload );
    }
  });
};


/*get the speicfic schedule*/
func.prototype.gSchedule = function (payload, cb) {
  let id = payload.body.sid;
  let doctors = payload.doctors;
  let fsche = payload.fsche;
  schedule.findById(id, '_id name content status').populate( [ { path: 'content.morning', select: '_id name' }, { path: 'content.afternoon', select: '_id name' }, { path: 'content.night', select: '_id name' }] ).exec( function(err, schedules) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(schedules != null) {
      let content = schedules.content;
      let days = content.length;
      let first = new Date(content[0].date).getDay();
      let fWeek = (7-first)%7;
      let lWeek = (days-fWeek)%7 ? (days-fWeek)%7 : 7;
      let mWeek = (days - fWeek - lWeek)/7;
      let scd = [];
      let tmp = [];
      for(let i=0; i<fWeek; i++) {
        tmp.push(content[i]);
      }
      scd.push(tmp);
      let c = fWeek;
      for(let i=0; i<mWeek; i++){
        tmp = [];
        for(let j=0; j<7; j++) {
          tmp.push(content[c]);
          c++;
        }
        scd.push(tmp);
      }
      tmp = [];
      for(let i=c; i<(c+lWeek); i++) {
        tmp.push(content[i]);
      }
      scd.push(tmp);

      cb( null, { "name": schedules.name,
                  "content": scd,
                  "status": schedules.status,
                  "doctors": doctors,
                  "fsche": fsche} );
    } else {
      cb( {"message": '班表不存在'} );
    }
  });
}

/*update the schedule*/
func.prototype.uSchedule = function (payload, cb) {
  let id = payload.body.sid;
  let cid = payload.body.cid;
  let content = JSON.parse(payload.body.content);
  let fsche = (payload.body.fsche !== 'undefined') ? JSON.parse(payload.body.fsche) : {};
  let status = payload.body.status;
  schedule.findByIdAndUpdate(id, {$set: {content: content, status: status}}, function(err, schedules) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      clinic.findByIdAndUpdate(cid, {$set: {fsche: fsche}}, function(err, clinics) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else {
          cb( null, payload );
        }
      })
    }
  })
}

module.exports = new func();
