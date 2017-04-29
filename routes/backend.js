var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var conn = require('../database/connection');
var passwordHash = require('password-hash');
var jwt = require('jwt-simple');
var keys = require('../configs/keys');

router.get('/dashboard',authChecker, function(req, res, next){
  res.render('backend/dashboard',{title: 'Dashboard'});
});
router.get('/login', function(req, res, next){
  console.log(req.session.admin);
  if(typeof(req.session.admin) !== 'undefined'){
    res.redirect('/heroku-backend/dashboard');
  }else{
    res.render('backend/login',{title: 'Login admin'});
  }
});
router.post('/login', function(req, res, next){
  var email = req.body.email;
  var password = req.body.password;
  if(email && password){
    conn.query('SELECT * FROM auths WHERE ?',{email: email}, function(err, rows){
      if(err) throw err;
      var errLogin = 0;
      if(rows.length > 0){
        if(passwordHash.verify(password, rows[0].password)){
          req.session.admin = email;
          res.redirect('/heroku-backend/dashboard');
        }
        else{
          res.render('backend/login',{title: 'Login admin', error: 'wrong'});
        }
      }else{
        res.render('backend/login',{title: 'Login admin', error: 'wrong'});
      }
    })
  }
});

router.get('/listUsers', authChecker , function(req, res, next){
  conn.query('SELECT * FROM users', function(err, rows){
    if(err) throw err;
    console.log(rows);
    if(rows.length > 0){
        res.render('backend/user/index', {title: 'List user', users: rows});
    }else{
      res.render('backend/user/index', {title: 'List user',users: []});
    }
  });
});

router.get('/deleteUser/:id', authChecker, function(req, res, next){
  var id = req.params.id;
  conn.query('DELETE FROM users WHERE ?',{id: id}, function(errQ, users){
    if(errQ) throw errQ;
    console.log('DELETEd');
    res.redirect('back');
  });
});

function authChecker(req, res, next){
  if (req.session.admin) {
        next();
    } else {
       res.redirect("/heroku-backend/login");
    }
}
module.exports = router;
