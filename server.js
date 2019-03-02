const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const controllers = {};
const viewers = {};

const port = 3000;

const viewer_socket = io.of('/viewer');
const controller_socket = io.of('/controller');

const width = 1920;
const height = 1080;
const fps = 5;
const speed = 1;
const padding = 10;

const worldSate = {
  width: width,
  height: height,
  controllers: {},
  projectiles: {}
}

app.get('/viewer', function(req, res){
  res.sendFile(__dirname +  '/viewer.html');
});

app.get('/controller', function(req, res) {
  res.sendFile(__dirname + '/controller.html');
});

function getRandomColor() {
  // Paul Irish
   return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function refreshViewers() {
  for (let viewer_id in viewers) {
    viewers[viewer_id].emit('refresh', worldSate);
  }
}

viewer_socket.on('connection', function(socket) {
  console.log('viewer connected', socket.id);
  viewers[socket.id] = socket;
  socket.emit('refresh', worldSate);
  socket.on('disconnect', function() {
    console.log('viewer disconnected', socket.id);
  });
});

controller_socket.on('connection', function(socket) {
  console.log('a controller connected', socket.id);
  controllers[socket.id] = socket;
  worldSate.controllers[socket.id] = {
    x: parseInt((width+10)*Math.random()) + 20,
    y: parseInt((height+10)*Math.random()) + 20,
    color: getRandomColor(),
    angle: Math.random()*2*Math.PI
  }
  refreshViewers();
  socket.on('disconnect', () => {
    console.log('a controller disconnected', socket.id);
    delete controllers[socket.id];
    delete worldSate.controllers[socket.id];
    refreshViewers();
  });
  socket.on('command', (command) => {
    console.log(socket.id, command);
  })
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});


function move(ctrlls) {
  for (let key in ctrlls) {
    let x = ctrlls[key].x;
    let y = ctrlls[key].y;
    x += speed*Math.cos(x);
    y += speed*Math.sin(y);
    if (x < width - padding && x > padding) {
      ctrlls[key].x = x;
    }
    if (y < height - padding && y > padding) {
      ctrlls[key].y = y;
    }
  }
}

function loop() {
  move(worldSate.controllers);
  move(worldSate.projectiles);

  refreshViewers();
}

setInterval(loop, 1/fps);

