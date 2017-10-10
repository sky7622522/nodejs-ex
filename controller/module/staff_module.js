var user = require('mongoose').model('User'),
    applylist = require('mongoose').model('Applylist');

var func = function () {};

/*check if any apply list exit or the applicant is a staff in applying clinic*/
func.prototype.checkApply = function (payload, cb) {
	let id = payload.member.id;
	let cid = payload.body.cid;
	applylist.find({cid: cid, uid: id}, function(err, applylists) {
		if(err) {
		  cb( {"message": '主機無法回應'} );
		} else if(applylists == null) {
		  cb( null, payload );
		} else if(applylists.status === 'reject') {
			cb( null, payload );
		} else {
			cb( {"message": '申請單處理中，或您已經是該診所行政人員了'} );
		}
	});
};

/*create the apply list*/
func.prototype.apply = function (payload, cb) {
	let id = payload.member.id;
	let cid = payload.body.cid;
	let position = '行政人員';
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

module.exports = new func();