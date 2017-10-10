'use strict';

const apiai = require('apiai');
const uuid = require('node-uuid');
const request = require('request');
const JSONbig = require('json-bigint');
const async = require('async');
const m = require('./message_module');

const APIAI_ACCESS_TOKEN = "9ba96c1d895a4ca3b6aa11b5397603e4";
const APIAI_LANG = "zh-TW";
const FB_PAGE_ACCESS_TOKEN = "EAAS59b6pWMsBAOeFbNwZB98UnsxEaqaKUvfTVQPjND6XZAjG1jMukJO12TA6FvAAbAdlfXda4mqtJnvrXNkXFMZBj2e5QVNRNIr6ruAIaFIuzHAgXj0hcC3bOlJYeyx814O2tNUNRKlQZB0NY9O9PH06QE30zU7TZAlI6bAOBFWQM6p9P93ra";
const FB_TEXT_LIMIT = 640;

module.exports = class FacebookBot {
  constructor() {
    this.apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: APIAI_LANG, requestSource: "fb"});
    this.sessionIds = new Map();
    this.messagesDelay = 200;
  }

  //do the response when api.ai return data formatted response
  doDataResponse(sender, facebookResponseData) {
    if (!Array.isArray(facebookResponseData)) {
      console.log('Response as formatted message');
      this.sendFBMessage(sender, facebookResponseData)
          .catch(err => console.error(err));
    } else {
      async.eachSeries(facebookResponseData, (facebookMessage, callback) => {
        if (facebookMessage.sender_action) {
          console.log('Response as sender action');
          this.sendFBSenderAction(sender, facebookMessage.sender_action)
              .then(() => callback())
              .catch(err => callback(err));
        }
        else {
          console.log('Response as formatted message');
          this.sendFBMessage(sender, facebookMessage)
              .then(() => callback())
              .catch(err => callback(err));
        }
      }, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Data response completed');
        }
      });
    }
  }

  //do the response when api.ai return message formatted response
  doRichContentResponse(sender, messages) {
    let facebookMessages = []; // array with result messages

    for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
      let message = messages[messageIndex];

      switch (message.type) {
        //message.type 0 means text message
        case 0:
          // speech: ["hi"]
          // we have to get value from fulfillment.speech, because of here is raw speech
          if (message.speech) {
            let splittedText = this.splitResponse(message.speech);

            splittedText.forEach(s => {
                facebookMessages.push({text: s});
            });
          }
          break;

        //message.type 1 means card message
        case 1:
          let carousel = [message];

          for (messageIndex++; messageIndex < messages.length; messageIndex++) {
            if (messages[messageIndex].type == 1) {
              carousel.push(messages[messageIndex]);
            } else {
              messageIndex--;
              break;
            }
          }

          let facebookMessage = {};
          carousel.forEach((c) => {
            // buttons: [ {text: "hi", postback: "postback"} ], imageUrl: "", title: "", subtitle: ""
            let card = {};

            card.title = c.title;
            card.image_url = c.imageUrl;
            if (this.isDefined(c.subtitle)) {
              card.subtitle = c.subtitle;
            }
            //If button is involved in.
            if (c.buttons.length > 0) {
              let buttons = [];
              for (let buttonIndex = 0; buttonIndex < c.buttons.length; buttonIndex++) {
                let button = c.buttons[buttonIndex];

                if (button.text) {
                  let postback = button.postback;
                  if (!postback) {
                      postback = button.text;
                  }

                  let buttonDescription = {
                      title: button.text
                  };

                  if (postback.startsWith("http")) {
                      buttonDescription.type = "web_url";
                      buttonDescription.url = postback;
                  } else {
                      buttonDescription.type = "postback";
                      buttonDescription.payload = postback;
                  }

                  buttons.push(buttonDescription);
                }
              }

              if (buttons.length > 0) {
                card.buttons = buttons;
              }
            }

            if (!facebookMessage.attachment) {
              facebookMessage.attachment = {type: "template"};
            }

            if (!facebookMessage.attachment.payload) {
              facebookMessage.attachment.payload = {template_type: "generic", elements: []};
            }

            facebookMessage.attachment.payload.elements.push(card);
          });

          facebookMessages.push(facebookMessage);
          break;

        //message.type 2 means quick replies message
        case 2:
          if (message.replies && message.replies.length > 0) {
            let facebookMessage = {};

            facebookMessage.text = message.title ? message.title : 'Choose an item';
            facebookMessage.quick_replies = [];

            message.replies.forEach((r) => {
              facebookMessage.quick_replies.push({
                content_type: "text",
                title: r,
                payload: r
              });
            });

            facebookMessages.push(facebookMessage);
          }
          break;

        //message.type 3 means image message
        case 3:

          if (message.imageUrl) {
            let facebookMessage = {};

            // "imageUrl": "http://example.com/image.jpg"
            facebookMessage.attachment = {type: "image"};
            facebookMessage.attachment.payload = {url: message.imageUrl};

            facebookMessages.push(facebookMessage);
          }

          break;

        //message.type 4 means custom payload message
        case 4:
          if (message.payload && message.payload.facebook) {
            facebookMessages.push(message.payload.facebook);
          }
          break;

        default:
            break;
      }
    }

    return new Promise((resolve, reject) => {
      async.eachSeries(facebookMessages, (msg, callback) => {
        this.sendFBSenderAction(sender, "typing_on")
            .then(() => this.sleep(this.messagesDelay))
            .then(() => this.sendFBMessage(sender, msg))
            .then(() => callback())
            .catch(callback);
      },
      (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('Messages sent');
          resolve();
        }
      });
    });
  }

  //do the response when api.ai return text formatted response
  doTextResponse(sender, responseText) {
    console.log('Response as text message');
    // facebook API limit for text length is 640,
    // so we must split message if needed
    let splittedText = this.splitResponse(responseText);

    async.eachSeries(splittedText, (textPart, callback) => {
      this.sendFBMessage(sender, {text: textPart})
          .then(() => callback())
          .catch(err => callback(err));
    });
  }

  //joint the webhook event(message event and postback event)
  getEventText(event) {
    if (event.message) {
      if (event.message.quick_reply && event.message.quick_reply.payload) {
        return event.message.quick_reply.payload;
      }
      if (event.message.text) {
        return event.message.text;
      }
    }

    if (event.postback && event.postback.payload) {
      return event.postback.payload;
    }
    return null;
  }

  //process the event come from messenger and send the event to api.ai
  //do the specific response after api.ai return the NLP result
  processEvent(event) {
    const sender = event.sender.id.toString();
    const text = this.getEventText(event);
    if (text) {

      // Handle a text message from this sender
      if (!this.sessionIds.has(sender)) {
          this.sessionIds.set(sender, uuid.v4());
      }

      console.log("Text", text);
      //send user's text to api.ai service
      let apiaiRequest = this.apiAiService.textRequest(text,
      {
        sessionId: this.sessionIds.get(sender),
        originalRequest: {
            data: event,
            source: "facebook"
        }
      });

      //get response from api.ai
      apiaiRequest.on('response', (response) => {
        if (this.isDefined(response.result) && this.isDefined(response.result.fulfillment)) {
          let responseText = response.result.fulfillment.speech;
          let responseData = response.result.fulfillment.data;
          let responseMessages = response.result.fulfillment.messages;
          let context = response.result.contexts;
          let action = response.result.action;
          //console.log(responseMessages);
          //console.log(context);
          //console.log(action);

          if (this.isDefined(responseData) && this.isDefined(responseData.facebook)) {
            let facebookResponseData = responseData.facebook;
            this.doDataResponse(sender, facebookResponseData);
          } else if (this.isDefined(responseMessages) && responseMessages.length > 0) {
            if(action == 'input.welcome' || text == 'GET_STARTED_PAYLOAD') {
              this.userInfoRequest(sender).then((info)=> {
                let payload = {uid: sender, name: info};
                m.gm(payload, function(err, rs) {
                  let f = new FacebookBot();
                  rs.unshift(responseMessages[0]);
                  f.doRichContentResponse(sender, rs);
                });
              }).catch(err=> {
                console.error(err);
              });
            } else if(text == 'FIND_PROGRESS_BY_ID') {
              let payload = {uid: sender};
              m.fpm(payload, function(err, rs) {
                let f = new FacebookBot();
                f.doRichContentResponse(sender, rs);
              });
            } else if(text == 'FIND_BLOG_BY_ID') {
              let payload = {uid: sender};
              m.fbm(payload, function(err, rs) {
                let f = new FacebookBot();
                f.doRichContentResponse(sender, rs);
              });
            } /*else if((action == 'find_progress_by_name' || action == 'find_progress') && context[0].name == 'clinic') {
              let payload = {'name': context[0].parameters.clinic};
              m.fp(payload, function(err, rs) {
                let f = new FacebookBot();
                f.doRichContentResponse(sender, rs);
              });
            } else if((action == 'find_schedule_by_name' || action == 'find_schedule') && context[0].name == 'clinic'){
              let payload = {'name': context[0].parameters.clinic};

            } else if(action == 'find_clinic_by_name' && context[0].name == 'clinic') {
              let payload = {'name': context[0].parameters.clinic};
              m.fc(payload, function(err, rs) {
                let f = new FacebookBot();
                f.doRichContentResponse(sender, rs);
              });
            }*/ else {
              this.doRichContentResponse(sender, responseMessages);
            }
          }
          else if (this.isDefined(responseText)) {
            this.doTextResponse(sender, responseText);
          }
        }
      });
      apiaiRequest.on('error', (error) => console.error(error));
      apiaiRequest.end();
    }
  }

  //setting response text upper bound
  splitResponse(str) {
    if (str.length <= FB_TEXT_LIMIT) {
        return [str];
    }
    return this.chunkString(str, FB_TEXT_LIMIT);
  }

  //throw out the char which over text upper bound
  chunkString(s, len) {
    let curr = len, prev = 0;
    let output = [];
    while (s[curr]) {
      if (s[curr++] == ' ') {
        output.push(s.substring(prev, curr));
        prev = curr;
        curr += len;
      }
      else {
        let currReverse = curr;
        do {
          if (s.substring(currReverse - 1, currReverse) == ' ') {
              output.push(s.substring(prev, currReverse));
              prev = currReverse;
              curr = currReverse + len;
              break;
          }
          currReverse--;
        } while (currReverse > prev)
      }
    }
    output.push(s.substr(prev));
    return output;
  }

  //send the message back to user
  sendFBMessage(sender, messageData) {
    return new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v2.9/me/messages',
        qs: {access_token: FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
          recipient: {id: sender},
          message: messageData
        }
      }, (error, response) => {
        if (error) {
          console.log('Error sending message: ', error);
          reject(error);
        } else if (response.body.error) {
          console.log('Error: ', response.body.error);
          reject(new Error(response.body.error));
        }
        resolve();
      });
    });
  }

  //send the messenger action(ex: typing) back to user
  sendFBSenderAction(sender, action) {
    return new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v2.9/me/messages',
        qs: {access_token: FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
          recipient: {id: sender},
          sender_action: action
        }
      }, (error, response) => {
        if (error) {
          console.error('Error sending action: ', error);
          reject(error);
        } else if (response.body.error) {
          console.error('Error: ', response.body.error);
          reject(new Error(response.body.error));
        }
        resolve();
      });
    });
  }

  //make server subscribe the facebook page
  doSubscribeRequest() {
    request({
      method: 'POST',
      uri: "https://graph.facebook.com/v2.9/me/subscribed_apps?access_token=" + FB_PAGE_ACCESS_TOKEN
    },
    (error, response, body) => {
      if (error) {
        console.error('Error while subscription: ', error);
      } else {
        console.log('Subscription result: ', response.body);
      }
    });
  }

  //check the object define or not
  isDefined(obj) {
    if (typeof obj == 'undefined') {
      return false;
    }
    if (!obj) {
      return false;
    }
    return obj != null;
  }

  //wait for messenger action(typing)
  sleep(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), delay);
    });
  }

  //get the user first name from facebook
  userInfoRequest(userId) {
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        uri: "https://graph.facebook.com/v2.9/" + userId + "?fields=first_name&access_token=" + FB_PAGE_ACCESS_TOKEN
      },
      function (error, info) {
        if (error) {
          console.error('Error while userInfoRequest: ', error);
          reject(error);
        } else {
          resolve(JSON.parse(info.body).first_name);
        }
      });
    });
  }

}
