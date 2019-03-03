console.log('controller js loaded');

let socket;

const noSleep = new NoSleep();

$(function() {
  $('div#status').html('Waiting for JS to detect orientation...');

  socket = io.connect('/controller');

  window.addEventListener('deviceorientation', processDeviceOrientationEvent);

  $('#fire-button').on('click', function() {
    noSleep.enable();
    socket.emit('command', 'fire');
  });
});

function processDeviceOrientationEvent(e) {
  $('div#status').empty();
  socket.emit('command', 'orientation', e.beta, e.gamma);
}
