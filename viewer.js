console.log('viewer js loaded');



$(function() {
  $('body').html('No GUI for now, viewer JS running...')

  const socket = io.connect('/viewer');

  console.log('socket is:', socket);
});
