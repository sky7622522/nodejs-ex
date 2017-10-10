var express = require('express'),
    router = express.Router(),
    async = require('async'),
    mod = require('./module/member_module');

/*
 *usage: get user basic information
 *parameter: none
 *return: photo, phone, sex, age
 */
router.route('/get').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.getInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: edit user basic information
 *parameter: phone, name, sex, age, image(file)
 */
router.route('/edit').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.parseEForm,
    mod.valEForm,
    mod.uploadPhoto,
    mod.editMember,
    mod.getInfo
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: upgrade user to doctor
 *parameter: profession, experience, department
 */
router.route('/doctor').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.valDForm,
    mod.upDoctor,
    mod.cDoctor,
    mod.reloadAuth
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

/*
 *usage: upgrade user to staff
 *parameter: none
 */
router.route('/staff').post( function(req, res) {
  async.waterfall([
    function(cb) {
      cb(null,req)
    },
    mod.upStaff,
  ], function (err, result) {
    if(err) {
      return res.status(400).json(err);
    }
    return res.status(200).json(result);
  });
})

module.exports = router;