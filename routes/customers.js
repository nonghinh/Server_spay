var express = require('express');
var router = express.Router();
var session = require('express-session');
var conn = require('../database/connection');
var passwordHash = require('password-hash');
var jwt = require('jwt-simple');
var keys = require('../configs/keys');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource usser');
});
router.get('/register', function(req, res, next) {
  res.render('frontend/customer/register', {title: 'Register'});
});
router.post('/register', function(req, res, next) {
  var name = req.body.fullname;
  var email = req.body.email;
  var password = req.body.password;
  var repassword = req.body.repassword;
  var phone = req.body.phone;
  var repassword = req.body.repassword;
  var birthday = req.body.birthday;
  var gender = req.body.gender;
  var idnumber = req.body.idnumber;
  var address = req.body.address;
  if(name && email && password && phone && birthday && gender && idnumber && address){
    conn.query('SELECT * FROM users WHERE ?', {email: email}, function(errE, emails){
      if(errE) throw errE;
      if(emails.length > 0){
        res.render('frontend/customer/register', {title: 'Register', error: 'email'});
      }else{
        conn.query('SELECT * FROM users WHERE ?', {phone: phone}, function(errP, phones){
          if(errP) throw errP;
          if(phones.length > 0){
            res.render('frontend/customer/register', {title: 'Register', error: 'phone'});
          }
          else{
            conn.query('SELECT * FROM customers WHERE ?', {id_number: idnumber}, function(errN, ids){
              if(errN) throw errN;
              if(ids.length > 0){
                res.render('frontend/customer/register', {title: 'Register', error: 'idnumber'});
              }else{

                if(password == repassword){
                  var hash = passwordHash.generate(password);
                  var access_token = jwt.encode({phone: phone, password: password}, keys.KEY_ACCESS_TOKEN);
                  conn.query('INSERT INTO users SET ?',{email: email, phone: phone ,password: hash, business: 0, access_token: access_token}, function(errU, result){
                    if(errU) throw errU;
                    conn.query('INSERT INTO customers SET ?', {user_id: result.insertId,fullname: name, gender: gender, birthday: birthday, id_number: idnumber, address: address}, function(errC){
                      if(errC) throw errC;
                      res.redirect('/users/login');
                    });
                  });

                }
                else{
                  res.render('frontend/customer/register', {title: 'Register', error: 'password'});
                }
              }
            });
          }
        });
      }
    });
  }
  else{
    res.render('frontend/customer/register', {title: 'Register', error: 'validate'});
  }

});

router.post('/loginApp', function(req, res, next) {
  var phone = req.body.phone !== 'undefined' ? req.body.phone : 000;
  var password = req.body.password !== 'undefined' ? req.body.password : '';
  conn.query("SELECT * FROM users WHERE ?", {phone: req.body.phone}, function(err, rows){
    if(err) throw err;
    if(rows.length > 0){
      if(passwordHash.verify(password, rows[0].password)){
        var access_token = rows[0].access_token;
        console.log(access_token);
        res.send(access_token);
      }
      else{
        res.send('wrong');
      }
    }
    else{
      res.send('wrong');
    }
  });
});

router.get('/dashboard', authChecker ,function(req, res, next){
  conn.query('SELECT * FROM users WHERE ?',{id: req.session.userId}, function(errU, users){
    if(errU) throw errU;
    conn.query('SELECT * FROM customers WHERE ?', {id: req.session.authId }, function(errC, customers){
      if(errC) throw errC;
      res.render('frontend/customer/dashboard',{title: 'Dashboard', user: users[0], customer: customers[0]});
    });
  });
});

function authChecker(req, res, next){
  if (req.session.email && req.session.role == 0) {
        next();
    } else {
       res.redirect("/users/login");
    }
}

module.exports = router;
