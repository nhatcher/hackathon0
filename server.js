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

viewer_socket.on('connection', function(socket) {
  console.log('viewer connected', socket.id);
  socket.on('disconnect', function() {
    console.log('viewer disconnected', socket.id);
  });
});

controller_socket.on('connection', function(socket) {
  console.log('a controller connected', socket.id);
  socket.on('disconnect', function() {
    console.log('a controller disconnected', socket.id);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

