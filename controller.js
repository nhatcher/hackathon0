console.log('controller js loaded');

const CONST = Object.freeze({
  ROTATE_MIN: 10,
  ROTATE_MAX: 90
});

let socket;

$(function() {
  $('div#status').html('Waiting for JS to detect orientation...')

  socket = io.connect('/controller');

  window.addEventListener('deviceorientation', processDeviceOrientationEvent);

  $('#fire-button').on('click', function() {
    socket.emit('command', 'fire');
  });
});

function processDeviceOrientationEvent(e) {
  $('div#status').empty();

  const rotationAngle = e.beta;
  const thrustAngle = e.gamma;

  const isLeft = rotationAngle < -CONST.ROTATE_MIN && rotationAngle > -CONST.ROTATE_MAX;
  const isRight = rotationAngle > CONST.ROTATE_MIN && rotationAngle < CONST.ROTATE_MAX;

  const isBack = thrustAngle < -CONST.ROTATE_MIN && thrustAngle > -CONST.ROTATE_MAX;
  const isForward = thrustAngle > CONST.ROTATE_MIN && thrustAngle < CONST.ROTATE_MAX;

  if (isLeft) socket.emit('command', 'left');
  if (isRight) socket.emit('command', 'right');
  if (isBack) socket.emit('command', 'back');
  if (isForward) socket.emit('command', 'forward');
}
