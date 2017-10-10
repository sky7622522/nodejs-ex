const FacebookBot = require('./module/messenger_module');
const f = new FacebookBot();
const express = require('express');
const router = express.Router();
const FB_VERIFY_TOKEN = "height_defined_by_your_attitude";
const m = require('./module/message_module');

//the route for messenger verification
router.get('/', (req, res) => {
  if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);

    setTimeout(() => {
      f.doSubscribeRequest();
    }, 3000);
  } else {
    res.send('Error, wrong validation token');
  }
});

//the route for response when user choose the clinic on webview
router.post('/clinic', (req, res) => {
  try {
    const data = req.body;
    m.fci(data, function(err, rs) {
      let fb = new FacebookBot();
      fb.doRichContentResponse(data.uid, rs);
    });
    return res.status(200).json({
      status: "ok"
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      error: err
    });
  }
});

//the route for all post with messenger
router.post('/', (req, res) => {
  try {
    const data = req.body;
    if (data.entry) {
      let entries = data.entry;
      entries.forEach((entry) => {
        let messaging_events = entry.messaging;
        if (messaging_events) {
          messaging_events.forEach((event) => {
            if (event.message && !event.message.is_echo ||
              event.postback && event.postback.payload) {
                f.processEvent(event);
            }
          });
        }
      });
    }

    return res.status(200).json({
      status: "ok"
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      error: err
    });
  }
});

module.exports = router;
