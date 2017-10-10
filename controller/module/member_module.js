var formidable = require('formidable'),
    fs = require('fs'),
    path = require('path'),
    mkdir = require('mkdirp'),
    rmdir = require('rimraf'),
    validator = require('validator'),
    jwt = require('jsonwebtoken'),
    jwtSecret = 'the new taiwan power',
		user = require('mongoose').model('User'),
    doctor = require('mongoose').model('Doctor'),
    staff = require('mongoose').model('Staff');

var func = function () {};

/*get the member basic information*/
func.prototype.getInfo = function (payload, cb) {
  var id = payload.member.id;
  user.findById(id, 'name photo phone sex age', function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb( null, { "name": users.name,
                  "photo": users.photo,
                  "phone": users.phone,
                  "sex": users.sex,
                  "age": users.age } );
    }
  });
};

/*parse the data/form format request*/
func.prototype.parseEForm = function (payload, cb) {
  let body = {};
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
    body['image'] = file;
  });
  
  form.on('end', function () {
    payload.body = body;
    cb(null, payload);
  });

  form.parse(payload);
}

/*validate the user edit information form*/
func.prototype.valEForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let name = payload.body.name;
  let sex = payload.body.sex;
  let age = payload.body.age;

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
func.prototype.uploadPhoto = function (payload, cb) {
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
        let type = photo.type.substring(6);
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

/*edit the user basic information*/
func.prototype.editMember = function (payload, cb) {
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

/*validate the user upgrade to doctor form*/
func.prototype.valDForm = function (payload, cb) {
  let isFormValid = true;
  let errors = {};
  let message = '';
  let profession = payload.body.profession;

  if (!profession || profession.trim().length === 0) {
    isFormValid = false;
    errors.profession = "請輸入專長";
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

/*upgrade the user to doctor*/
func.prototype.upDoctor = function (payload, cb) {
  let id = payload.member.id;
  user.findByIdAndUpdate(id, {$set: {role: '2'}}, function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb(null, payload);
    }
  });
};

func.prototype.cDoctor = function (payload, cb) {
  let id = payload.member.id;
  let pro = payload.body.profession;
  let exp = payload.body.experience;
  let dep = payload.body.department;
  pro = pro.split(',');
  exp = exp.split(',');
  doctor.create({
    uid: id,
    info: {"pro": pro, "exp": exp, "dep": dep},
    clinic: [],
  }, function(err, doctors) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      cb(null, payload);
    }
  });
};

func.prototype.reloadAuth = function (payload, cb) {
  let id = payload.member.id;
  let pro = payload.body.profession;
  let exp = payload.body.experience;
  let dep = payload.body.department;
  user.findById(id, 'name role', function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      let ticket = {
        id: id,
        name: users.name,
        role: users.role
      };
      let token = jwt.sign(ticket, jwtSecret);

      cb( null, { "profession": pro,
                  "experience": exp,
                  "department": dep,
                  "token": token } );
    }
  });
};

/*upgrade the user to staff*/
func.prototype.upStaff = function (payload, cb) {
	var id = payload.member.id;
	user.findByIdAndUpdate(id, {$set: {role: '3'}}, function(err, users) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      staff.create({
        uid: id,
        clinic: [],
      }, function(err, doctors) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else {
          cb( null, {"message": '升級完成'} );
        }
      })
    }
  });
};

module.exports = new func();