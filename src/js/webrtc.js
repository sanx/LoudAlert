var SoundMeter = require('./webrtc-samples/soundmeter.js');
// start webrtc sample code
var instantMeter,
    slowMeter,
    clipMeter,
    successCallback,
    errorCallback,
    audioContext,
    constraints,
    stop;

function successCallback(stream) {
  soundMeter = new SoundMeter(audioContext);
  soundMeter.connectToSource(stream);

  sampleInterval = setInterval(function() {
    instantMeter = soundMeter.instant.toFixed(2);
    slowMeter = soundMeter.slow.toFixed(2);
    clipMeter = soundMeter.clip;
    //console.log("instant: " + instantMeter + ", slow: " + slowMeter + ", clip: " + clipMeter);
  }, 200);
}

function errorCallback(error) {
  console.log('navigator.getUserMedia error: ', error);
}

try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContext();
} catch (e) {
  alert('Web Audio API not supported.');
}

// put variables in global scope to make them available to the browser console
constraints = {
  audio: true,
  video: false
};

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// end webrtc sample code

getSnapshot = function () {
    return {
        instantMeter: instantMeter,
        slowMeter: slowMeter,
        clipMeter: clipMeter
    }
};

stop = function () {
    soundMeter.stop();
    clearInterval(sampleInterval);
    instantMeter = 0;
    slowMeter = 0;
    clipMeter = 0;
}

module.exports = {
    getSnapshot: getSnapshot,
    successCallback: successCallback,
    errorCallback: errorCallback,
    audioContext: audioContext,
    constraints: constraints,
    stop: stop
};
