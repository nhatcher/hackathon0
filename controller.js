console.log('controller js loaded');

$(function() {
  $('body').html('No GUI for now, controller JS running...')

  var socket = io();

  console.log('socket is:', socket);
});