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

const width = 1920*0.75;
const height = 1080*0.75;
const fps = 5;
const padding = 10;
const speedUnit = 0.2;
const angleUnit = 1*2*Math.PI/360; // 10 degrees
const maxSpeed = 30;

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
    angle: Math.random()*2*Math.PI,
    speed: 0
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
    const ctrl = worldSate.controllers[socket.id];
    let speed = 0;
    switch(command) {
      case 'fire':
        const id = Math.ceil(Math.random()*1000000);
        worldSate.projectiles[id] = {
          x: ctrl.x,
          y: ctrl.y,
          angle: ctrl.angle,
          speed: ctrl.speed  + speedUnit
        }
      break;
      case 'left':
        ctrl.angle -= angleUnit; 
      break;
      case 'right':
        worldSate.controllers[socket.id].angle += angleUnit;
      case 'forward':
        speed = worldSate.controllers[socket.id].speed + speedUnit;
        if (speed<maxSpeed) {
          worldSate.controllers[socket.id].speed = speed;
        }
      break;
      case 'back':
        speed = Math.floor(Math.abs(worldSate.controllers[socket.id].speed - speedUnit));
        if (speed>=0) {
          worldSate.controllers[socket.id].speed = speed;
        }
      break;
    }
  })
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});


function moveControllers() {
  const ctrlls = worldSate.controllers;
  for (let key in ctrlls) {
    let x = ctrlls[key].x;
    let y = height - ctrlls[key].y;
    const angle = Math.PI/2 - ctrlls[key].angle;
    const speed = ctrlls[key].speed;
    // console.log(x,y, rad, key)
    x += Math.ceil(speed*Math.cos(angle));
    y += Math.ceil(speed*Math.sin(angle));
    // console.log(x, y);
    if (x < width - padding && x > padding) {
      ctrlls[key].x = x;
    }
    if (y < height - padding && y > padding) {
      ctrlls[key].y = height - y;
    }
  }
}

function moveProjectiles() {
  const projectiles = worldSate.projectiles;
  const keys = Object.keys(projectiles);
  for (let i=0; i<keys.length; i++) {
    const key = keys[i];
    const projectile = projectiles[key];
    let x = projectile.x;
    let y = height - projectile.y;
    const angle = Math.PI/2 - projectile.angle;
    const speed = projectiles.speed;
    // console.log(x,y, rad, key)
    x += Math.ceil(speed*Math.cos(angle));
    y += Math.ceil(speed*Math.sin(angle));
    // console.log(x, y);
    if (x < width - padding && x > padding) {
      projectile.x = x;
    } else {
      // delete projectiles[key];
    }
    if (y < height - padding && y > padding) {
      projectile.y = height - y;
    } else {
      // delete projectiles[key];
    }
  }
}

function loop() {
  moveControllers();
  moveProjectiles();

  refreshViewers();
}

setInterval(loop, 1000/fps);

