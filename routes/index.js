var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var auth = null;
  if(req.session.role == 1){
    auth = 'business';
  }
  if(req.session.role == 0){
    auth = 'customer';
  }
  res.render('frontend/index', { title: 'Home', auth: auth });
});

router.get('/userRegister', function(req, res, next){
  res.render('frontend/option_register',{title: 'Choose register option'});
});

module.exports = router;
