var jwt = require('jwt-simple');
var keys = require('../configs/keys.js');
var datetime = require('node-datetime');
var conn = require('../database/connection.js');
var toEncode = require('nodejs-base64-encode');
var base64 = require('base-64');

var users = [];
exports = module.exports = function(io){
  io.on('connection', function(socket){

    socket.on('clientPay', function(data){
      var access_token = data.access_token;
      var dataString = base64.decode(data.dataPayment);
      var dataPayment = JSON.parse(dataString);
      console.log(dataPayment);
      conn.query('SELECT * FROM users WHERE ?', {access_token: access_token}, function(errU, users){
        if(errU) throw errU;
        var phonenum = users[0].phone;
        if(phonenum.indexOf('0') == 0){
          phonenum = phonenum.replace('0', '84');
        }
        conn.query('SELECT * FROM customers WHERE ?',{user_id: users[0].id}, function(errC, customers){
          if(errC) throw errC;
          var money = parseInt(customers[0].money);
          var total = parseInt(dataPayment.price);
          if(money >= total){
            //Thanh toan
            var m = money - total;
            conn.query('UPDATE customers SET money = ? WHERE id = ?',[m, customers[0].id], function(errUp, update){
              if(errUp) throw errUp;
            });
            var bill1 = {
              app_id: dataPayment.appid,
              customer_id: customers[0].id,
              product_id: dataPayment.itemid,
              case_id: dataPayment.caseid,
              price: dataPayment.price,
              message: dataPayment.comments,
              status: 1
            };

            conn.query('INSERT INTO bills SET ?', bill1, function(errB1, data){
              if(errB1) throw errB1;
            });
            var msgSuccess = 'Bạn đã thanh toán thành công.';
            io.sockets.connected[socket.id].emit('serverReply', msgSuccess, 1);

          }
          else{
            //Het tien, khong thanh toan
            var bill2 = {
              app_id: dataPayment.appid,
              customer_id: customers[0].id,
              product_id: dataPayment.itemid,
              caseid: dataPayment.caseid,
              price: dataPayment.price,
              message: dataPayment.comments,
              status: 0
            };
            conn.query('INSERT INTO bills SET ?', bill2, function(errB2){
              if(errB2) throw errB2;
            });
            var msgFail = 'Tài khoản của bạn không đủ để thanh toán, vui lòng nạp thêm tiền. Cảm ơn đã sử dụng dịch vụ của chúng tôi.';
            io.sockets.connected[socket.id].emit('serverReply', msgFail, 0);
          }
        });
      });
    });
    socket.on('disconnect', function(){
      console.log('Client'+socket.id+' disconnected');
      delete users[socket.id];
      console.log(users);
    });


  });
}
