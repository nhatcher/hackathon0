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
const fps = 25;
const padding = 10;
const speedUnit = 1;
const angleUnit = 1*2*Math.PI/360;
const maxSpeed = 50;

const worldState = {
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
    viewers[viewer_id].emit('refresh', worldState);
  }
}

viewer_socket.on('connection', function(socket) {
  console.log('viewer connected', socket.id);
  viewers[socket.id] = socket;
  socket.emit('refresh', worldState);
  socket.on('disconnect', function() {
    console.log('viewer disconnected', socket.id);
  });
});

controller_socket.on('connection', function(socket) {
  console.log('a controller connected', socket.id);
  controllers[socket.id] = socket;
  worldState.controllers[socket.id] = {
    x: parseInt((width+10)*Math.random()) + 20,
    y: parseInt((height+10)*Math.random()) + 20,
    color: getRandomColor(),
    angle: Math.random()*2*Math.PI,
    speed: 0,
    alive: true
  }
  refreshViewers();
  socket.on('disconnect', () => {
    console.log('a controller disconnected', socket.id);
    delete controllers[socket.id];
    delete worldState.controllers[socket.id];
    refreshViewers();
  });
  socket.on('command', (command) => {
    console.log(socket.id, command);
    const ctrl = worldState.controllers[socket.id];
    if (!ctrl || !ctrl.alive) {
      return;
    }
    let speed = 0;
    switch(command) {
      case 'fire':
        const id = Math.ceil(Math.random()*1000000);
        const angle = ctrl.angle
        worldState.projectiles[id] = {
          x: ctrl.x + 2*padding*Math.sin(angle),
          y: ctrl.y - 2*padding*Math.cos(angle),
          angle: angle,
          speed: ctrl.speed  + speedUnit*10
        }
      break;
      case 'left':
        ctrl.angle -= angleUnit;
      break;
      case 'right':
        worldState.controllers[socket.id].angle += angleUnit;
      case 'forward':
        speed = worldState.controllers[socket.id].speed + speedUnit;
        if (speed<maxSpeed) {
          worldState.controllers[socket.id].speed = speed;
        }
      break;
      case 'back':
        speed = Math.floor(Math.abs(worldState.controllers[socket.id].speed - speedUnit));
        worldState.controllers[socket.id].speed = speed;
      break;
    }
  })
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});


function movePeriodic(ctrlls) {
  for (let key in ctrlls) {
    let x = ctrlls[key].x;
    let y = ctrlls[key].y;
    const angle = ctrlls[key].angle;
    const speed = ctrlls[key].speed*5/fps;
    // console.log(x,y, rad, key)
    x += Math.ceil(speed*Math.sin(angle));
    y -= Math.ceil(speed*Math.cos(angle));
    // console.log(x, y);
    if (x > width ) {
      x = x - width;
    }
    if (x <0) {
      x += width;
    }
    ctrlls[key].x = x;
    if (y > height) {
      y = y - height;
    } else if (y < 0) {
      y = y + height;
    }
    ctrlls[key].y = y;
  }
}


function moveBounded(ctrlls) {
  for (let key in ctrlls) {
    let x = ctrlls[key].x;
    let y = height - ctrlls[key].y;
    const angle = Math.PI/2 - ctrlls[key].angle;
    const speed = ctrlls[key].speed*5/fps;
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

function isCollision(ctrl, x, y) {
  const cx = ctrl.x;
  const cy = ctrl.y;
  if (Math.abs(x-cx)<padding && Math.abs(y-cy) < padding) {
    return true;
  }
  return false;
}

function testCollission(ctrlls, projectiles) {
  for (let p_id in projectiles) {
    const projectile = projectiles[p_id];
    const x = projectile.x;
    const y = projectile.y;
    for (let key in ctrlls) {
      const ctrl = ctrlls[key];
      if (isCollision(ctrl, x, y)) {
        ctrl.alive = false;
        setTimeout(() => {
          delete ctrlls[key];
          delete controllers[key];
        }, 2000);
      }
    }
  }
}

function loop() {
  const ctrlls = worldState.controllers;
  const projectiles = worldState.projectiles;
  movePeriodic(ctrlls);
  movePeriodic(projectiles);
  testCollission(ctrlls, projectiles);

  refreshViewers();
}

setInterval(loop, 1000/fps);

