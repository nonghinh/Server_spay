var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var conn = require('../database/connection');
var passwordHash = require('password-hash');
var jwt = require('jwt-simple');
var keys = require('../configs/keys');
var base64 = require('base-64');
var ds = require('data-save');

router.get('/accepted/:appid/:caseid', function(req, res, next){
  var app_id = req.params.appid;
  var case_id = req.params.caseid;
  var active = ds.get(app_id+'-'+case_id, 'payjson');
  console.log(active);
  if(typeof(active) !== 'undefined'){
    ds.remove(app_id+'-'+case_id, 'payjson');
    res.send(active.product_id);
  }
  else{
    res.send('null');
  }
});

module.exports = router;
