var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');

var db = require('./model/db');
var clinic = require('./model/clinic');
var user = require('./model/user');
var doctor = require('./model/doctor');
var staff = require('./model/staff');
var record = require('./model/record');
var applylist = require('./model/applylist');
var schedule = require('./model/schedule');
var history = require('./model/history');
var memory = require('./model/memory');
var letter = require('./model/letter');
var number = require('./model/number');

var users = require('./controller/user');
var members = require('./controller/member');
var doctors = require('./controller/doctor');
var staffs = require('./controller/staff');
var bots = require('./controller/bot');
var clinics = require('./controller/clinic');
var authMember = require('./passport/authMember')();
var authDoctor = require('./passport/authDoctor')();
var authStaff = require('./passport/authStaff')();
var authClinic = require('./passport/authClinic')();

var app = express();
var compression = require('compression');

//webpack hotloading variable
/*var webpack = require('webpack');
var config = require('./webpack.config');
var compiler = webpack(config);*/

require('./passport')();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.session());
app.use(compression());

//set webpack hotloading middleware environment
/*app.use(require('webpack-dev-middleware')(compiler, {
  publicPath: config.output.publicPath
}));
app.use(require('webpack-hot-middleware')(compiler));*/

//route the url to controller
app.use('/scripts',express.static(__dirname + '/views/js/'));
app.use('/css',express.static(__dirname + '/views/css/'));
app.use('/image',express.static('../data/image/'));
app.use('/logo',express.static('../data/logo/'));
app.use('/picture',express.static('../data/picture/'));
app.use('/user', users);
app.use('/member', authMember, members);
app.use('/doctor', authDoctor, doctors);
app.use('/staff', authStaff, staffs);
app.use('/clinic', authClinic, clinics);
app.use('/bot', bots);

//messenger webview page
app.get('/list', function(req,res) {
  res.render('list');
});

app.get('/schedule/:id', function(req,res) {
  res.render('schedule');
});

//routiman web react page
app.get('*', function(req,res) {
  res.render('index');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
