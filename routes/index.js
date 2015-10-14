var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'scribbled.in', user: req.user});
});

/* GET about page. */
router.get('/about', function(req, res, next) {
    res.render('about', {title: 'about', user: req.user})
});

/* GET document page. */
router.get('/documents', function(req, res, next) {
    res.render('documents', {title: 'documents', user: req.user})
});

/* GET catullus 85 page. */
router.get('/catullus', function(req, res, next) {
    res.render('catullus', {title: 'catullus', user: req.user})
});

/* GET user page. */
router.get('/user', function(req, res, next) {
    res.render('user', {title: 'user', user: req.user})
});

/* GET signin page. */
router.get('/signin', function(req, res, next) {
    res.render('signin', {title: 'Sign In', user: req.user})
});

/* POST through signup strategy */
router.post('/local-reg', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signin'
}));

/* POST through login strategy */
router.post('/login', passport.authenticate('local-signin', {
    successRedirect: '/',
    failureRedirect: '/signin'
}));

/* GET logout */
router.get('/logout', function(req, res, next){
    var name = req.user.username;
    console.log("LOGGING OUT " + req.user.username)
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
});

module.exports = router;
