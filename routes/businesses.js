var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var conn = require('../database/connection');
var passwordHash = require('password-hash');
var jwt = require('jwt-simple');
var keys = require('../configs/keys');
var base64 = require('base-64');
app.use(session({
  secret: keys.KEY_SESSION,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false}}));

router.get('/register', function(req, res, next){
  res.render('frontend/business/register', {title: 'Register'});
});

router.post('/register', function(req, res, next) {
  var name = req.body.fullname;
  var email = req.body.email;
  var password = req.body.password;
  var repassword = req.body.repassword;
  var phone = req.body.phone;
  var repassword = req.body.repassword;
  var website = req.body.website;
  var license = req.body.license;
  var description = req.body.description;
  var address = req.body.address;
  if(name && email && password && phone && website && license && description && address){
    conn.query('SELECT * FROM users WHERE ?', {email: email}, function(errE, emails){
      if(errE) throw errE;
      if(emails.length > 0){
        res.render('frontend/business/register', {title: 'Register', error: 'email'});
      }else{
        conn.query('SELECT * FROM users WHERE ?', {phone: phone}, function(errP, phones){
          if(errP) throw errP;
          if(phones.length > 0){
            res.render('frontend/business/register', {title: 'Register', error: 'phone'});
          }
          else{
            conn.query('SELECT * FROM businesses WHERE ?', {website: website}, function(errN, ids){
              if(errN) throw errN;
              if(ids.length > 0){
                res.render('frontend/business/register', {title: 'Register', error: 'web'});
              }else{

                if(password == repassword){
                  var hash = passwordHash.generate(password);
                  var access_token = jwt.encode({phone: phone, password: password}, keys.KEY_ACCESS_TOKEN);
                  conn.query('INSERT INTO users SET ?',{email: email, phone: phone, password: hash, business: 1, access_token: access_token}, function(errU, result){
                    if(errU) throw errU;
                    conn.query('INSERT INTO businesses SET ?', {user_id: result.insertId, name: name, license: license, website: website, description: description, address: address}, function(errC){
                      if(errC) throw errC;
                      res.redirect('/users/login');
                    });
                  });

                }
                else{
                  res.render('frontend/business/register', {title: 'Register', error: 'password'});
                }
              }
            });
          }
        });
      }
    });
  }
  else{
    res.render('frontend/business/register', {title: 'Register', error: 'validate'});
  }

});

router.get('/dashboard', authChecker ,function(req, res, next){
  conn.query('SELECT * FROM users WHERE ?', {id: req.session.userId}, function(errU, users){
    if(errU) throw errU;
    conn.query('SELECT * FROM businesses WHERE ?',{id: req.session.authId}, function(errB, rows){
      if(errB) throw errB;
      conn.query('SELECT * FROM apps WHERE ?',{business_id: req.session.authId}, function(errA, apps){
        res.render('frontend/business/index',{title:'Dashboard', user: users[0], business: rows[0], apps: apps});
      });
    });
  });
});

router.get('/createApp', authChecker, function(req,res, next){
  console.log(req.session.authId);
  res.render('frontend/business/createapp',{title: 'Create app'});
});
router.post('/createApp', authChecker, function(req, res, next){
  var name = req.body.appname;
  var email = req.body.email;
  var phone = req.body.phone;
  var type = req.body.type;
  var description = req.body.description;
  var business_id = req.session.authId;

  if(name && email && phone && type && description){
    conn.query('INSERT INTO apps SET ?',{business_id: business_id, name: name, email: email, phone: phone, type: type, description: description}, function(err, rows){
      if(err) throw err;
      res.redirect('/businsesses/dashboard');
    });
  }else {
    res.render('frontend/business/createapp',{title: 'Create app', error: 'validate'});
  }
});

router.get('/viewapp/:business/:id', authChecker ,function(req, res, next){
  var id = req.params.id;
  conn.query('SELECT * FROM apps WHERE ?',{id: id},function(err, apps){
    if(err) throw err;
    conn.query('SELECT * FROM bills WHERE ?',{app_id: id}, function(errB, rows){
      if(errB) throw errB;
      var bills = null;
      if(rows.length > 0){
        bills = rows;
      }
      res.render('frontend/business/viewapp',{title: 'View app', app: apps[0], code: id, bills: bills});
    });

  });
});

//Xóa thông báo giao dịch
router.get('/deleteAllMsg/:appid', authChecker, function(req, res, next){
  var appid = req.params.appid;
  conn.query('DELETE FROM bills WHERE ?', {app_id: appid}, function(err, data){
    if(err) throw err;
    res.redirect('back');
  });
});

router.get('/deleteMsg/:id', authChecker, function(req, res, next){
  var id = req.params.id;
  conn.query('DELETE FROM bills WHERE ?', {id: id}, function(err, data){
    if(err) throw err;
    res.redirect('back');
  });
});

//AJAX
router.get('/renderCode', function(req, res, next){
  var app_id = req.query.app_id;
  var product_id = req.query.product_id;
  var product_name = req.query.product_name;
  var product_price = req.query.product_price;
  var case_id = req.query.case_id;
  if(app_id && product_id && product_name && product_price && case_id){
    var dataJson = {
      app_id: app_id,
      product_id: product_id,
      product_name: product_name,
      product_price: product_price,
      case_id: case_id
    };
    var dataEncode = base64.encode(JSON.stringify(dataJson));
    res.send({status: 1, code: dataEncode});
  }else{
    res.send({status: 0, code: ''});
  }
});
function authChecker(req, res, next){
  if (req.session.email && req.session.role == 1) {
        next();
    } else {
       res.redirect("/users/login");
    }
}
module.exports = router
