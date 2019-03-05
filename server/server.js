const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');


const root_dir = path.join(__dirname, '/../', 'client');
console.log(root_dir);

app.use(express.static(root_dir));

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
  res.sendFile(path.join(root_dir, 'viewer', 'viewer.html'));
});

app.get('/controller', function(req, res) {
  res.sendFile(path.join(root_dir, 'controller', 'controller.html'));
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

function sendSound(type) {
  for (let viewer_id in viewers) {
    viewers[viewer_id].emit('sound', type);
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
  const color = getRandomColor();
  worldState.controllers[socket.id] = {
    x: parseInt((width+10)*Math.random()) + 20,
    y: parseInt((height+10)*Math.random()) + 20,
    color: color,
    angle: Math.random()*2*Math.PI,
    speed: 0,
    alive: true,
    beta: 0,
    gamma: 0
  }
  socket.emit('setting', 'color', color);
  sendSound('new_player');
  refreshViewers();
  socket.on('disconnect', () => {
    console.log('a controller disconnected', socket.id);
    delete controllers[socket.id];
    delete worldState.controllers[socket.id];
    refreshViewers();
  });
  socket.on('command', (command, beta, gamma) => {
    // console.log(socket.id, command);
    const ctrl = worldState.controllers[socket.id];
    if (!ctrl || !ctrl.alive) {
      return;
    }

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
        sendSound('fire');
      break;
      case 'orientation':
        ctrl.beta = 2*Math.PI*Math.floor(Math.abs(beta/10))*10*Math.sign(beta)/360;
        ctrl.gamma = gamma;
      break;
    }
  })
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});


function movePeriodic(ctrlls) {
  for (let key in ctrlls) {
    const ctrl = ctrlls[key];
    let x = ctrlls[key].x;
    let y = ctrlls[key].y;
    let angle = ctrlls[key].angle;
    let speed = ctrlls[key].speed;
    if ('beta' in ctrl) {
      const beta = ctrl.beta;
      const gamma = ctrl.gamma;
      angle += beta*5/fps;
      speed += gamma/fps;
      if (speed>maxSpeed) {
        speed = maxSpeed;
      } else if (speed<0) {
        speed = 0;
      }
    }
    x += Math.ceil(speed*Math.sin(angle)*5/fps);
    y -= Math.ceil(speed*Math.cos(angle)*5/fps);
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
    ctrl.angle = angle;
    ctrl.speed = speed;
  }
}

function moveBounded(ctrlls) {
  const keys = Object.keys(ctrlls);
  for (let i=0; i<keys.length ; i++) {
    const key = keys[i];
    const ctrl = ctrlls[key];
    let x = ctrl.x;
    let y = ctrl.y;
    let angle = ctrl.angle;
    let speed = ctrl.speed;
    x += Math.ceil(speed*Math.sin(angle)*5/fps);
    y -= Math.ceil(speed*Math.cos(angle)*5/fps);
    if (x <0 || x> width || y<0 || y>height) {
      delete ctrlls[key];
    } else {
      ctrl.x = x;
      ctrl.y = y;
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
        sendSound('explosion');
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
  moveBounded(projectiles);
  testCollission(ctrlls, projectiles);

  refreshViewers();
}

setInterval(loop, 1000/fps);

