var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var conn = require('../database/connection');
var passwordHash = require('password-hash');
var jwt = require('jwt-simple');
var keys = require('../configs/keys');

app.use(session({
  secret: keys.KEY_SESSION,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false}}));
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource usser');
});

router.get('/login', function(req, res, next) {
  if(req.session.email){
    res.redirect('/');
  }
  res.render('frontend/login',{title: 'Đăng nhập'});
});
router.post('/login', function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  if(email && password){
    conn.query('SELECT * FROM users WHERE ?',{email: email}, function(err, rows){
      if(err) throw err;
      if(rows.length > 0){
        if(passwordHash.verify(password, rows[0].password)){
          req.session.email = email;
          req.session.access_token = rows[0].access_token;
          req.session.role = rows[0].business;
          req.session.userId = rows[0].id;
          console.log(rows[0].business);
          if(rows[0].business == 1){
            conn.query('SELECT * FROM businesses WHERE ?',{user_id: rows[0].id}, function(errB, busi){
              if(errB) throw errB;
              req.session.authId = busi[0].id;
              res.redirect('/businesses/dashboard');
            });
          }
          else{
            conn.query('SELECT * FROM customers WHERE ?',{user_id: rows[0].id}, function(errC, cus){
              if(errC) throw errC;
              req.session.authId = cus[0].id;
              res.redirect('/customers/dashboard');
            });
          }
        }
      }
      else{
        res.render('frontend/login',{title: 'Đăng nhập', error: 'validate'});
      }
    });
  }
});

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err) throw err;
  });
  res.redirect('/');
});


module.exports = router;
