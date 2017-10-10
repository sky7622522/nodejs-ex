var express = require('express'),
    router = express.Router(),
    number = require('mongoose').model('Number');

/*
 *usage: upload clinic room registered number
 *parameter: no
 */
router.route('/no').post( function(req, res) {
  number.findByIdAndUpdate(req.number.id, {$set: {no: req.body.no}}, function(err, numbers){
		if(err) {
      return res.status(400).json( {"message": '主機無法回應'} );
    } else {
    	return res.status(200).json( {"message": req.body.no});
    }
	});
});

module.exports = router;