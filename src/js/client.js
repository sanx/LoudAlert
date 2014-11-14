var _ = require('lodash');
var React = require('react');

var SoundMeter = require('./webrtc-samples/soundmeter.js');

var LoudAlert = React.createClass({
    render: function () {
        return (
            <html>
            <head>
                <script src="/static/js/client.js" />
            </head>
            <body>
                <header>
                    <Controls />
                </header>
            </body>
            </html>
        );
    }
});

var Simple = React.createClass({
    render: function () {
        return (
            <div>hhaha</div>
        );
    }
});

var Controls = React.createClass({
    onMicStatusChange: function (e) {
        console.log(this.refs.turnOnMic.getDOMNode().checked);
        _.forEach(this.refs, function (prop, name) {
            //console.log("prop name: " + name);
        });
        _.forEach(this.refs.turnOnMic, function (prop, name) {
            //console.log("prop name: " + name);
        });
        console.log("checked: " + this.refs.turnOnMic.checked);
        //navigator.getUserMedia(constraints, successCallback, errorCallback);
    },
    render: function () {
        console.log('rendering Controls');
        return (
            <div>
            <form>
            <fieldset>
            <legend>kd</legend>
            </fieldset>
            </form>
            </div>
        );
    }
});


function successCallback(stream) {
  // put variables in global scope to make them available to the browser console
  window.stream = stream;
  var soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
  soundMeter.connectToSource(stream);

  setInterval(function() {
    instantMeter.value = instantValueDisplay.innerText =
      soundMeter.instant.toFixed(2);
    slowMeter.value = slowValueDisplay.innerText =
      soundMeter.slow.toFixed(2);
    clipMeter.value = clipValueDisplay.innerText =
      soundMeter.clip;
  }, 200);
}

function errorCallback(error) {
  console.log('navigator.getUserMedia error: ', error);
}

//navigator.getUserMedia(constraints, successCallback, errorCallback);

/*try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioContext = new AudioContext();
} catch (e) {
  alert('Web Audio API not supported.');
}

// put variables in global scope to make them available to the browser console
var constraints = window.constraints = {
  audio: true,
  video: false
};

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;*/

React.render(
    <Controls />,
    document.getElementById('Controls')
);
