var mysql = require('mysql');
var db = require('./config.js');
var conn = mysql.createConnection({
  host: db.host,
  user: db.user,
  password: db.password,
  database: db.database,
});

//Connect to database
conn.connect(function(err){
  if(!err) {
      console.log("Database is connected ... nn");
  } else {
      console.log("Error connecting database ... nn");
  }
});

module.exports = conn;
