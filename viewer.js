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
  $('body').empty().html(JSON.stringify(worldState, null, 2));
}
