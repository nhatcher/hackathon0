const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const controllers = {};
const viewers = {};

app.get('/viewer', function(req, res){
  res.sendFile(__dirname +  '/viewer.html');
});

app.get('/controller', function(req, res) {
  res.sendFile(__dirname + '/controller.html');
});

const viewer_socket = io.of('/viewer');
const controller_socket = io.of('/controller');

function refreshViewers() {
  for (let viewer_id in viewers) {
    viewers[viewer_id].emit('controllerListUpdated', Object.keys(controllers));
  }
}
viewer_socket.on('connection', function(socket) {
  console.log('viewer connected', socket.id);
  viewers[socket.id] = socket;
  socket.on('disconnect', function() {
    console.log('viewer disconnected', socket.id);
  });
});

controller_socket.on('connection', function(socket) {
  console.log('a controller connected', socket.id);
  controllers[socket.id] = socket;
  refreshViewers();
  socket.on('disconnect', function() {
    console.log('a controller disconnected', socket.id);
    delete controllers[socket.id];
    refreshViewers();
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

