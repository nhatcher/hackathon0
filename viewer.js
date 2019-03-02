console.log('viewer js loaded');



$(function() {
  const socket = io.connect('/viewer');

  console.log('socket is:', socket);

  socket.on('controllerListUpdated', function(controllerList){
    console.log('EVENT:', controllerList);
    renderControllerList(controllerList);
  });
});

function renderControllerList(controllerList) {
  const ul = $('body ul#controller-list');
  ul.empty();
  controllerList.forEach(function(controllerID) {
    const li = $('<li>').html(controllerID);
    li.appendTo(ul);
  });
}
