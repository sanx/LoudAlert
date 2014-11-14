var _ = require('lodash');
var React = require('react');

var SoundMeter = require('./webrtc-samples/soundmeter.js');

var LoudAlert = React.createClass({displayName: 'LoudAlert',
    render: function () {
        return (
            React.createElement("html", null, 
            React.createElement("head", null, 
                React.createElement("script", {src: "/static/js/client.js"})
            ), 
            React.createElement("body", null, 
                React.createElement("header", null, 
                    React.createElement(Controls, null)
                )
            )
            )
        );
    }
});

var Simple = React.createClass({displayName: 'Simple',
    render: function () {
        return (
            React.createElement("div", null, "hhaha")
        );
    }
});

var Controls = React.createClass({displayName: 'Controls',
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
            React.createElement("div", null, 
            React.createElement("form", null, 
            React.createElement("fieldset", null, 
            React.createElement("legend", null, "kd")
            )
            )
            )
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
    React.createElement(Controls, null),
    document.getElementById('Controls')
);
