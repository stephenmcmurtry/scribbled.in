var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');

var config = require('./config.js'); //config file contains all tokens and other private info
var funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var routes = require('./routes/index');

var fs = require('fs');

var app = express();

// app.use/routes/etc...

var server = app.listen(3001);
var io = require('socket.io').listen(server);

// MongoDB stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server.");
    db.close();
});

io.on('connection', function (socket) {

    // DB Methods

    var insertDocument = function(db, data, callback) {
        db.collection('annotations').insertOne({
            "user": data.user,
            "document": data.document,
            "line": data.line,
            "note": data.note
        }, function(err, result) {
            assert.equal(err, null);
            console.log("Inserted a document into the annotations collection.");
            callback(result);
        });
    };

    var getUserNotes = function(db, data, callback) {
        var cursor =db.collection('annotations').find( { "user": data.user, "document": data.document} );
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                console.dir(doc);
                socket.emit('queryResults', doc);
            } else {
                callback();
            }
        });
    };

    var getAllNotes = function(db, data, callback) {
        var cursor =db.collection('annotations').find( {"document": data.document} );
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                console.dir(doc);
                socket.emit('allNotes', doc);
            } else {
                callback();
            }
        });
    };

    // End DB Methods


    socket.on('note', function(data) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            insertDocument(db, data, function() {
                db.close();
            });
        });
        console.log(data);
    });

    socket.on('noteRequest', function(data) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            getUserNotes(db, data, function() {
                db.close();
            });
        });
    });

    socket.on('getAllNotes', function(data) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            getAllNotes(db, data, function() {
                db.close();
            });
        });
    })
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/scripts", express.static(__dirname + '/scripts'));

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
    console.log("serializing " + user.username);
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    console.log("deserializing " + obj);
    done(null, obj);
});

// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
        funct.localAuth(username, password)
            .then(function (user) {
                if (user) {
                    console.log("LOGGED IN AS: " + user.username);
                    req.session.success = 'You are successfully logged in ' + user.username + '!';
                    done(null, user);
                }
                if (!user) {
                    console.log("COULD NOT LOG IN");
                    req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
                    done(null, user);
                }
            })
            .fail(function (err){
                console.log(err.body);
            });
    }
));

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use('local-signup', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
        funct.localReg(username, password)
            .then(function (user) {
                if (user) {
                    console.log("REGISTERED: " + user.username);
                    req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
                    done(null, user);
                }
                if (!user) {
                    console.log("COULD NOT REGISTER");
                    req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
                    done(null, user);
                }
            })
            .fail(function (err){
                console.log(err.body);
            });
    }
));

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.session.error = 'Please sign in!';
    res.redirect('/signin');
}

//
//  END PASSPORT
//

// Session-persisted message middleware
app.use(function(req, res, next){
    var err = req.session.error,
        msg = req.session.notice,
        success = req.session.success;

    delete req.session.error;
    delete req.session.success;
    delete req.session.notice;

    if (err) res.locals.error = err;
    if (msg) res.locals.notice = msg;
    if (success) res.locals.success = success;

    next();
});

// Pulls routes from index.js
app.use('/', routes);

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
