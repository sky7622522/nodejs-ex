var express = require('express'),
    router = express.Router(),
    async = require('async'),
    mod = require('./module/staff_module');

/*
 *usage: apply the clinic for staff
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
})

/*router.route('/reservation')
	//get the reservation management page
	.get( function(req, res) {
		res.render('staff/reservation');
	})
	//get all reservation today
	.post( function(req, res) {
		if(res.session.user && res.session.user.role == 'staff') {
			var cid = req.body.cid;
			var date = new Date();
			reservation.find({"cid": cid, "ctime": {"$gte": date}}, function(err, reservations) {
				if(err) {
	        //Database select error messages
	        console.log("database select reservation error");
	        //response JSON back to client
	        res.json( {"status": '0'} );
	      } else {
	      	//get all user name reserved by user id
	      	var rs = [];
	      	forEachAsync(reservations, function(e) {
		      	user.findById(e.uid, 'name', function(err, users) {
		      		if(err) {
				        //Database select error messages
				        console.log("database select user error");
				        //response JSON back to client
				        res.json( {"status": '0'} );
				      } else {
				      	var tmp = {"id": e.uid, "name": users.name, "no": reservations.no, "status": reservations.status};
				      	rs.push(tmp);
				      }
		      	})
		      }).then( function() {
		      	res.json( {"status": '1', "result": rs} );
		      })
	      }
			})
		} else {
			res.json( {"status": '2'} );
		}
	})

//give the number and status
router.route('/reserve').post( function(req, res) {
	if(res.session.user && res.session.user.role == 'staff') {
		var no = req.body.no;
		var status = req.body.status;
		var rid = req.body.rid;
		reservation.findByIdAndUpdate(rid, {$set: {"no": no, "status": status}}, function(err, reservation) {
      if(err) {
        //Database update error messages
        console.log("database update reservation error");
        //response JSON back to client
        res.json( {"status": '0'} );
      } else {
        res.json( {"status": '1'} );
      }
    });
	} else {
		res.json( {"status": '2'} );
	}
})*/

module.exports = router;