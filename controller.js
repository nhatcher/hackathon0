console.log('controller js loaded');

let socket;
let game_started = false;

const noSleep = new NoSleep();

$(function() {
  $('div#status').html('Waiting for JS to detect orientation...');


  $('#button').on('click', function() {
    if (game_started) {
      socket.emit('command', 'fire');
    } else {
      game_started = true;
      noSleep.enable();
      socket = io.connect('/controller');
      window.addEventListener('deviceorientation', processDeviceOrientationEvent);
      $(this).text('FIRE!');
    }
  });
});

function processDeviceOrientationEvent(e) {
  $('div#status').empty();
  socket.emit('command', 'orientation', e.beta, e.gamma);
}
