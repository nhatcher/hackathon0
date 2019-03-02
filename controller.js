console.log('controller js loaded');

$(function() {
  $('body').html('No GUI for now, controller JS running...')

  var socket = io.connect('localhost:3000/controller');

  console.log('socket is:', socket);
});
