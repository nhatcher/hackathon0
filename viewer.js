console.log('viewer js loaded');

$(function() {
  const socket = io.connect('/viewer');

  console.log('socket is:', socket);

  socket.on('refresh', function(newWorldState){
    console.log('new world state:', newWorldState);
    draw(newWorldState);
  });
});

function draw(worldState) {
  $('div#debug').empty().html(JSON.stringify(worldState, null, 2));
  const canvas = $('#canvas')[0];
  const ctx = canvas.getContext('2d');

  Object.keys(worldState.controllers).forEach(function(controllerID) {
    const controller = worldState.controllers[controllerID];
    ctx.fillStyle = controller.color;
    ctx.beginPath();
    ctx.moveTo(75, 50);
    ctx.lineTo(100, 75);
    ctx.lineTo(100, 25);
    ctx.fill();
  });

}
