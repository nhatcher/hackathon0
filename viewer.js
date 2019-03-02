console.log('viewer js loaded');

// same as server.js padding + some extra to make it appear large enough
const PADDING = 10 + 5;

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
  var starCount = Math.random()*1000;
  for (var i=0;i<starCount;i++) {
    stars.push({
      x: Math.random(),
      y: Math.random()
    })
  }
}

function draw(worldState) {
  $('div#debug').empty().html(JSON.stringify(worldState, null, 2));
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
    const controller = worldState.controllers[controllerID];
    ctx.save();
    ctx.translate(controller.x, controller.y);
    ctx.rotate(controller.angle);
    ctx.fillStyle = controller.color;
    ctx.beginPath();
    const x = - PADDING;
    const y = - PADDING;
    ctx.moveTo(x + PADDING, y); // point of arrow
    ctx.lineTo(x, y + PADDING * 2);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.fill();
    ctx.moveTo(x + PADDING, y); // point of arrow
    ctx.lineTo(x + PADDING * 2, y + PADDING * 2);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.lineTo(x + PADDING, y + PADDING);
    ctx.fill();
    ctx.translate(-controller.x, -controller.y);
    ctx.restore();
  });

}
