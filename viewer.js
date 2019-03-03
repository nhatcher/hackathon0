console.log('viewer js loaded');

// same as server.js padding + some extra to make it appear large enough
const PADDING = 10 + 5;

const explosionImg = new Image();
explosionImg.src = '/assets/explosion.png';

$(function() {
  const socket = io.connect('/viewer');

  console.log('socket is:', socket);

  generateStars();

  socket.on('refresh', function(newWorldState){
    draw(newWorldState);
  });
});

const stars = [];
function generateStars() {
  var starCount = Math.random()*800 + 200;
  for (var i=0;i<starCount;i++) {
    stars.push({
      x: Math.random(),
      y: Math.random()
    })
  }
}

function draw(worldState) {
  // $('div#debug').empty().html(JSON.stringify(worldState, null, 2));
  const canvas = $('#canvas');
  const ctx = canvas[0].getContext('2d');

  canvas[0].width = worldState.width;
  canvas[0].height = worldState.height;

  ctx.fillStyle = '#1c253c';
  ctx.fillRect(0, 0, worldState.width, worldState.height);

  ctx.fillStyle = '#dddddd';
  stars.forEach(function(star) {
    ctx.fillRect(star.x*worldState.width, star.y*worldState.height, 1, 1);
  });

  Object.keys(worldState.controllers).forEach(function(controllerID) {
    const ship = worldState.controllers[controllerID];
    drawShip(ctx, ship);
  });

  ctx.fillStyle = '#ffffff';
  Object.keys(worldState.projectiles).forEach(function(projectileKey) {
    const projectile = worldState.projectiles[projectileKey];
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI*2);
    ctx.fill();
  });
}

function drawShip(ctx, ship) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  const x = - PADDING;
  const y = - PADDING;

  if (ship.alive) {
    ctx.moveTo(x + PADDING, y); // point of arrow
    ctx.lineTo(x, y + PADDING * 2);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.fill();
    ctx.moveTo(x + PADDING, y); // point of arrow
    ctx.lineTo(x + PADDING * 2, y + PADDING * 2);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.fill();
  } else {
    ctx.drawImage(explosionImg, x, y, 2 * PADDING, 2 * PADDING);
    ctx.moveTo(x, y);
    ctx.lineTo(x + PADDING, y + PADDING / 2);
    ctx.lineTo(x, y + PADDING / 2);
    ctx.fill();
    ctx.moveTo(x + PADDING * 2, y + PADDING * 2);
    ctx.lineTo(x + PADDING * 3, y + PADDING * 3);
    ctx.lineTo(x + PADDING * 2, y + PADDING * 2.5);
    ctx.fill();
    ctx.moveTo(x - PADDING, y - PADDING * 2);
    ctx.lineTo(x - PADDING / 2, y - PADDING * 2.5);
    ctx.lineTo(x - PADDING, y - PADDING * 0.5);
    ctx.fill();
  }

  ctx.translate(-ship.x, -ship.y);
  ctx.restore();
}