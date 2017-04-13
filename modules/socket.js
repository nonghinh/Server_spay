var jwt = require('jwt-simple');
var keys = require('../configs/keys.js');
var datetime = require('node-datetime');
var conn = require('../database/connection.js');

var users = [];
exports = module.exports = function(io){
  io.on('connection', function(socket){

    socket.on('disconnect', function(){
      console.log('Client'+socket.id+' disconnected');
      delete users[socket.id];
      console.log(users);
    });
  });
}
