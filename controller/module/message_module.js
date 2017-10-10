const server_url = "https://www.routiman.com";
const user = require('mongoose').model('User');
const clinic = require('mongoose').model('Clinic');
const doctor = require('mongoose').model('Doctor');
const schedule = require('mongoose').model('Schedule');
const memory = require('mongoose').model('Memory');

var func = function () {};

//user first time using routiman bot
func.prototype.gs = function(payload, cb) {
  memory.create({
    fid: payload.uid,
    longTerm : {
      name: payload.name
    },
    shortTerm: {}
  }, function (err, memories) {
    if (err) {
      cb( {"message": '主機無法回應'} );
    } else {
      let p = [{'type': 0, 'speech': "嗨~~ "+payload.name+
      "!\n我是Donus機器人，很高興認識你。\n我可以告訴你診所的即時公告，診所的班表以及診所的看診燈號哦" },
      {'type': 4, 'payload': {
        'facebook': {
          attachment: {
            type: "template",
            payload: {
              "template_type":"button",
              "text":"請問你現在需要什麼服務呢?",
              "buttons":[
                {
                  "type":"web_url",
                  "url":server_url+"/list",
                  "title":"找診所",
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall"
                }
              ]
            }
          }
        }
      }}];
      cb( null, p );
    }
  });
}

//greeting message
func.prototype.gm = function(payload, cb) {
  memory.findOne({fid: payload.uid}, function (err, memories) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else if(memories){
      let b = [
        {
          "type":"web_url",
          "url":server_url+"/list",
          "title":"找診所",
          "messenger_extensions": true,
          "webview_height_ratio": "tall"
        }
      ];
      let r = [];
      if(memories && memories.shortTerm && memories.shortTerm.vClinic) {
        b = [
          {
            "type":"web_url",
            "url":server_url+"/schedule/"+memories.shortTerm.vClinic,
            "title":"查詢班表",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
          },
          {
            "type":"web_url",
            "url":server_url+"/list",
            "title":"找其他的診所",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
          }
        ];
        r = [
          {
            "content_type":"text",
            "title":"查詢看診進度",
            "payload":"FIND_PROGRESS_BY_ID"
          },
          {
            "content_type":"text",
            "title":"查詢佈告欄",
            "payload":"FIND_BLOG_BY_ID"
          }
        ];
      }
      let p = [{'type': 4, 'payload': {
        'facebook': {
          attachment: {
            type: "template",
            payload: {
              "template_type":"button",
              "text":"請問你現在需要什麼服務呢?",
              "buttons": b
            }
          }
        }
      }}];
      if(r.length > 0) {
        p[0].payload.facebook.quick_replies = r;
      }
      cb( null, p );
    } else {
      memory.create({
        fid: payload.uid,
        longTerm : {
          name: payload.name
        },
        shortTerm: {}
      }, function (err, memories) {
        if (err) {
          cb( {"message": '主機無法回應'} );
        } else {
          let p = [{'type': 0, 'speech': "嗨~~ "+payload.name+
          "!\n我是Donus機器人，很高興認識你。\n我可以告訴你診所的即時公告，\n診所的班表以及診所的看診燈號哦" },
          {'type': 4, 'payload': {
            'facebook': {
              attachment: {
                type: "template",
                payload: {
                  "template_type":"button",
                  "text":"請問你現在需要什麼服務呢?",
                  "buttons":[
                    {
                      "type":"web_url",
                      "url":server_url+"/list",
                      "title":"找診所",
                      "messenger_extensions": true,
                      "webview_height_ratio": "tall"
                    }
                  ]
                }
              }
            }
          }}];
          cb( null, p );
        }
      });
    }
  });
}

//find clinic by clinic id
func.prototype.fci = function(payload, cb) {
  clinic.findById(payload.cid, function(err, clinics) {
    if(err) {
      console.log(err);
      cb( {"message": '主機無法回應'} );
    } else if(clinics) {
      let short = {vClinic: clinics._id};
      memory.findOneAndUpdate({fid: payload.uid}, {
        $set: {
          "shortTerm": short
        }
      }, function (err, memories) {
        if (err) {
          cb( {"message": '主機無法回應'} );
        } else {
          let p = [{'type': 0, 'speech': clinics.info.des},{'type': 4, 'payload': {
            'facebook': {
              attachment: {
                type: "template",
                payload: {
                  template_type: 'generic',
                  elements: [{
                    title: clinics.name,
                    subtitle: "類型: "+clinics.type+"\u000A預約電話: "+clinics.info.rTel+"\u000A早班: "+clinics.info.time.morning
                              +"\u000A午班: "+clinics.info.time.afternoon+"\u000A晚班: "+clinics.info.time.night,
                    image_url: server_url+clinics.logo,
                    "buttons":[
                      {
                        "type":"web_url",
                        "url":server_url+"/schedule/"+clinics._id,
                        "title":"查詢班表",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                      },
                      {
                        "type":"web_url",
                        "url":server_url+"/list",
                        "title":"找其他的診所",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                      }
                    ]
                  }]
                }
              },
              quick_replies: [
                {
                  "content_type":"text",
                  "title":"查詢看診進度",
                  "payload":"FIND_PROGRESS_BY_ID"
                },
                {
                  "content_type":"text",
                  "title":"查詢佈告欄",
                  "payload":"FIND_BLOG_BY_ID"
                }
              ]
            }
          }}];
          cb( null, p );
        }
      });

    }
  });
}

//find progress by clinic id in memory
func.prototype.fpm = function(payload, cb) {
  memory.findOne({fid: payload.uid}, function(err, memories) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      clinic.findById(memories.shortTerm.vClinic, function(err, clinics) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else {
          doctor.find({"uid": {"$in": clinics.doctor}}, '_id uid info clinic').populate({path: 'uid', select: 'name photo'}).exec(function(err, doctors) {
            if(err) {
              console.log(err);
              cb( {"message": '主機無法回應'} );
            } else {
              let rs = [];
              for(let i=0; i<doctors.length; i++) {
                doctors[i].clinic = doctors[i].clinic.filter((d) => d._id.toString() == clinics._id.toString());
                doctors[i].light = doctors[i].clinic[0].no;
                let tmp = {
                  title: doctors[i].uid.name+'醫師',
                  subtitle: (doctors[i].light > 0) ? "目前看診進度: "+doctors[i].light : "目前未看診",
                  image_url: server_url+doctors[i].uid.photo
                }
                rs.push(tmp);
              }
              let p = [{'type': 4, 'payload': {
                'facebook': {
                  attachment: {
                    type: "template",
                    payload: {
                      template_type: 'generic',
                      elements: rs
                    }
                  }
                }
              }},
              {'type': 4, 'payload': {
                'facebook': {
                  attachment: {
                    type: "template",
                    payload: {
                      "template_type":"button",
                      "text":"請問還能幫您什麼嗎?",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url":server_url+"/schedule/"+clinics._id,
                          "title":"查詢班表",
                          "messenger_extensions": true,
                          "webview_height_ratio": "tall",
                        },
                        {
                          "type":"web_url",
                          "url":server_url+"/list",
                          "title":"找其他的診所",
                          "messenger_extensions": true,
                          "webview_height_ratio": "tall",
                        }
                      ]
                    }
                  },
                  quick_replies: [
                    {
                      "content_type":"text",
                      "title":"查詢看診進度",
                      "payload":"FIND_PROGRESS_BY_ID"
                    },
                    {
                      "content_type":"text",
                      "title":"查詢佈告欄",
                      "payload":"FIND_BLOG_BY_ID"
                    }
                  ]
                }
              }}
              ];
              cb( null, p );
            }
          });
        }
      });
    }
  });
}

//find blog by clinic id in memory
func.prototype.fbm = function(payload, cb) {
  memory.findOne({fid: payload.uid}, function(err, memories) {
    if(err) {
      cb( {"message": '主機無法回應'} );
    } else {
      clinic.findById(memories.shortTerm.vClinic, function(err, clinics) {
        if(err) {
          cb( {"message": '主機無法回應'} );
        } else {
          let p = [
          { 'type': 0,
            'speech': clinics.info.blog
          },
          {'type': 4, 'payload': {
            'facebook': {
              attachment: {
                type: "template",
                payload: {
                  "template_type":"button",
                  "text":"請問還能幫您什麼嗎?",
                  "buttons":[
                    {
                      "type":"web_url",
                      "url":server_url+"/schedule/"+clinics._id,
                      "title":"查詢班表",
                      "messenger_extensions": true,
                      "webview_height_ratio": "tall",
                    },
                    {
                      "type":"web_url",
                      "url":server_url+"/list",
                      "title":"找其他的診所",
                      "messenger_extensions": true,
                      "webview_height_ratio": "tall",
                    }
                  ]
                }
              },
              quick_replies: [
                {
                  "content_type":"text",
                  "title":"查詢看診進度",
                  "payload":"FIND_PROGRESS_BY_ID"
                },
                {
                  "content_type":"text",
                  "title":"查詢佈告欄",
                  "payload":"FIND_BLOG_BY_ID"
                }
              ]
            }
          }}
          ];
          cb( null, p );
        }
      });
    }
  });
}

//find progress by clinic name's keyword
func.prototype.fp = function(payload, cb) {
  let con = {};
  con["name"] = new RegExp(payload.name, "g");

  clinic.find(con, function(err, clinics) {
    if(err) {
      console.log(err);
      cb( {"message": '主機無法回應'} );
    } else if(clinics.length>0 && clinics.length<2) {
      clinics = clinics[0];
      doctor.find({"uid": {"$in": clinics.doctor}}, '_id uid info clinic').populate({path: 'uid', select: 'name photo'}).exec(function(err, doctors) {
        if(err) {
          console.log(err);
          cb( {"message": '主機無法回應'} );
        } else {
          let rs = [];
          for(let i=0; i<doctors.length; i++) {
            doctors[i].clinic = doctors[i].clinic.filter((d) => d._id.toString() == clinics._id.toString());
            doctors[i].light = doctors[i].clinic[0].no;
            let tmp = {
              title: doctors[i].uid.name+'醫師',
              subtitle: (doctors[i].light > 0) ? "目前看診進度: "+doctors[i].light : "目前未看診",
              image_url: server_url+doctors[i].uid.photo
            }
            rs.push(tmp);
          }
          let p = [{'type': 4, 'payload': {
            'facebook': {
              attachment: {
                type: "template",
                payload: {
                  template_type: 'generic',
                  elements: rs
                }
              },
              quick_replies: [
                {
                  content_type: "text",
                  title: "查詢班表",
                  payload: "find_schedule_by_name"
                },
                {
                  content_type: "text",
                  title: "查詢看診進度",
                  payload: "find_progress_by_name"
                }
              ]
            }
          }}];
          cb( null, p );
        }
      });
    } else if(clinics.length<0) {

    } else {
      //more than 1 clinic have same name
      console.log(clinics);
    }
  });
}

//find clinic by clinic name's keyword
func.prototype.fc = function(payload, cb) {
  let con = {};
  con["name"] = new RegExp(payload.name, "g");

  clinic.find(con, function(err, clinics) {
    if(err) {
      console.log(err);
      cb( {"message": '主機無法回應'} );
    } else if(clinics.length>0) {
      clinics = clinics[0];
      let p = [{'type': 0, 'speech': clinics.info.des},{'type': 4, 'payload': {
        'facebook': {
          attachment: {
            type: "template",
            payload: {
              template_type: 'generic',
              elements: [{
                title: clinics.name,
                subtitle: "類型: "+clinics.type+"\u000A預約電話: "+clinics.info.rTel+"\u000A早班: "+clinics.info.time.morning
                          +"\u000A午班: "+clinics.info.time.afternoon+"\u000A晚班: "+clinics.info.time.night,
                image_url: server_url+clinics.logo
              }]
            }
          },
          quick_replies: [
            {
              content_type: "text",
              title: "查詢班表",
              payload: "find_schedule_by_name"
            },
            {
              content_type: "text",
              title: "查詢看診進度",
              payload: "find_progress_by_name"
            }
          ]
        }
      }}];
      cb( null, p );
    } else if(clinics.length<0) {

    } else {
      //more than 1 clinic have same name
      console.log(clinics);
    }
  });
}

module.exports = new func();
