console.log('viewer js loaded');



$(function() {
  $('body').html('No GUI for now, viewer JS running...')

  const socket = io.connect('localhost:3000/viewer');

  console.log('socket is:', socket);
});
