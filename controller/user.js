var express = require('express'),
    router = express.Router(),
    async = require('async'),
    passport = require('passport'),
    mod = require('./module/user_module');

/*
 *usage: create the user
 *parameter: email, name, password
 */
router.route('/register').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.valCForm,
    mod.cMail,
    mod.cUser,
    //mod.sMail,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: authenticate the user email
 *parameter: id, auth
 */
router.route('/authentication').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.auth,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: login
 *parameter: email, password
 */
router.route('/login').post( function(req, res, next) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.valLForm,
  ], function (err) {
    if(err) {
      if (err.name === "error") {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json(err);
    }
    mod.login(req, res, next)
  });
})

/*
 *usage: facebook login
 *parameter: none
 */
router.get('/facebook', passport.authenticate('fb-login', { authType: 'rerequest', scope: ['email'] }));

/*
 *usage: get facebook authenticate result
 *parameter: none
 */
router.get('/facebook/return', passport.authenticate('fb-login', { failureRedirect: '/login' }), function(req, res){
  req.session.user = req.user;
  res.redirect('/fblogin');
});

/*
 *usage: return the result of the facebook login
 *parameter: none
 */
router.post('/getToken', function(req, res){
  if(req.session.user) {
    res.status(200).json({ message: "登入成功", token: req.session.user });
  } else {
    res.status(400).json({ message: "登入失敗" });
  }
});

/*
 *usage: list all clinic(using at doctors and staff applying for clinic)
 *parameter: none
 */
router.route('/allClinic').post( function(req, res) {
  async.waterfall([
    mod.allClinic,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: list clinic with condition (using at user searching for clinic)
 *parameter: name, city, district, type
 */
router.route('/list').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.clinicList,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: show the specific clinic information
 *parameter: cid
 */
router.route('/clinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body.cid)
    },
    mod.cDetail
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: show the doctor detail list in specific clinic
 *parameter: cid
 */
router.route('/doctor').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body.cid)
    },
    mod.dList,
    mod.dDetail
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});


/*
 *usage: list a doctor current number in specific clinic
 *parameter: cid, did
 */
router.route('/current').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.nList
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: get the specific date of the specific clinic schedule
 *parameter: cid, title, date
 */
router.route('/schedule').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.body)
    },
    mod.schedule
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: get all doctor's current number of the specific clinic(use for bot)
 *parameter: cid
 */
router.route('/numberBot').get( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.query.cid)
    },
    mod.dList,
    mod.dDetail
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    let msg = [];
    for(let i=0; i<result.length; i++) {
      let rs = "";
      rs += result[i].name+"醫師 "+result[i].state;
      if(result[i].state == "看診中") rs += "，看診號碼: "+result[i].light;
      msg.push({text: rs});
    }
    return res.json(msg);
  });
});

module.exports = router;
