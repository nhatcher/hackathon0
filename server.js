const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const ctrs = [];
const viewers = [];

app.get('/viewer', function(req, res){
  res.sendFile(__dirname +  '/viewer.html');
});

app.get('/controller', function(req, res) {
  res.sendFile(__dirname + '/controller.html');
});

const viewer_socket = io.of('/viewer');
const controller_socket = io.of('/controller');

let viewer;
let controllers = [];

viewer_socket.on('connection', function(socket) {
  console.log('viewer connected', socket.id);
  viewer = socket;
  socket.on('disconnect', function() {
    console.log('viewer disconnected', socket.id);
  });
});

controller_socket.on('connection', function(socket) {
  console.log('a controller connected', socket.id);
  controllers.push(socket.id);
  viewer.emit('controllerListUpdated', controllers);
  socket.on('disconnect', function() {
    console.log('a controller disconnected', socket.id);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

