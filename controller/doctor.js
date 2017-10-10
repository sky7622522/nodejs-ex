var express = require('express'),
    router = express.Router(),
    async = require('async'),
    mod = require('./module/doctor_module');

/*
 *usage: list all clinic using for doctor apply
 *parameter: none
 */
router.route('/allClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.getCList
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: apply the clinic for doctor
 *parameter: cid
 */
router.route('/apply').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkApply,
    mod.apply,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: list all apply waiting for response
 *parameter: cid
 */
router.route('/applylist').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.getAList,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: repaly the specific doctor's apply
 *parameter: cid, aid, response
 */
router.route('/replyApply').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.uApply,
    mod.pClinic,
    mod.pUser,
    mod.getAList
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: list all clinic doctor work at and list all clinic doctor manage to and list all the doctor schedule
 *parameter: none
 */
router.route('/wmsClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req.member.id)
    },
    mod.wClinic,
    mod.mClinic,
    mod.gSList
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: get doctor professional information
 *return: name, photo, phone, sex, age, professional, experience, department
 */
router.route('/get').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.getBInfo,
    mod.getPInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: edit doctor basic and professional information
 *parameter: image, phone, sex, age, profession, experience, department
 */
router.route('/edit').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.parseForm,
    mod.valEForm,
    mod.uploadImage,
    mod.editBInfo,
    mod.editPInfo,
    mod.getBInfo,
    mod.getPInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: get doctor current number
 *parameter: cid
 */
router.route('/cNumber').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkDAuth,
    mod.cNumber
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: update doctor current number
 *parameter: room, cid
 */
router.route('/uNumber').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkDAuth,
    mod.uNumber
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: setting clinic upload number environment
 *parameter: cid, room
 */
router.route('/sNumber').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkDAuth,
    mod.sNumber
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: create the clinic
 *parameter: day
 */
router.route('/cClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.create,
    mod.cRecord,
    mod.addClinic
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: get the clinic information
 *parameter: cid
 */
router.route('/gClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.getCInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: update the clinic
 *parameter: cid, name, rNumber, aNumber, morning, afternoon, night, description, logo, picture, service, equipment, type, city, district, address, blog
 *return: name, rNumber, aNumber, morning, afternoon, night, description, logo, picture, service, equipment, type, city, district, address, blog
 */
router.route('/uClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.parseForm,
    mod.checkMAuth,
    mod.valCForm,
    mod.uploadLogo,
    mod.uploadPicture,
    mod.updateClinic,
    mod.updatePicture,
    mod.getCInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: extend the clinic deadline
 *parameter: cid, day
 */
router.route('/eClinic').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.cdeadline,
    mod.cRecord,
    mod.extendClinic
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: send a clinic newletter
 *parameter: cid, letter
 */
router.route('/send').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.eLetter,
    mod.cLetter,
    mod.rLetter
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: create clinic schedule
 *parameter: cid, name
 */
router.route('/cSchedule').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkMAuth,
    mod.cSchedule
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: get the specific schedule
 *parameter: cid, sid
 */
router.route('/gSchedule').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkDAuth,
    mod.gDList,
    mod.gSchedule
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

/*
 *usage: update clinic schedule
 *parameter: cid, sid, content, fsche, status
 */
router.route('/uSchedule').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.checkDAuth,
    mod.uSchedule,
    mod.gDList,
    mod.gSchedule
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
});

module.exports = router;
