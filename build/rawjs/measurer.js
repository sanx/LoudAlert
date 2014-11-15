var util = require('util');
var events = require('events');
var _ = require('lodash');

/**
 * options:
 * *   freq (this object's sample rate, in ms)
 * *   timeToTrigger (in ms)
 * *   threshold (0 to 1)
 */
var Measurer = function (webrtc, options) {
    if (!webrtc || !webrtc.getSnapshot) {
        throw Error("firt param (webrtc) is required and must have getSnapshot property!");
    }
    this.webrtc = webrtc;
    var options = options || {};
    this.freq = options.freq || 200; // how often the measurer runs
    this.timeToTrigger = options.timeToTrigger || 100; // ms
    this.threshold = options.threshold || 1; // max
    this.measuringInterval = null;
    this.previousMeasure = null; // {time: Date.now(), snapshot: webrtc.getSnapshot}
    this.start();
    this.overThresholdSince = null;
    this.volumeTimeSinceOverThreshold = 0;
    this.topVolumeTimeAlerts = [0, 0, 0];
    console.log("time to trigger: " + this.timeToTrigger);
};

util.inherits(Measurer, events.EventEmitter);

Measurer.prototype.setThreshold = function (threshold) {
    console.log("setting threshold to: " + threshold);
    this.threshold = threshold;
};

Measurer.prototype.setTimeToTrigger = function (timeToTrigger) {
    this.timeToTrigger = timeToTrigger;
};

Measurer.prototype.start = function () {
    this.measuringInterval = setInterval(this.callback.bind(this), this.freq);
};

Measurer.prototype.stop = function () {
    clearInterval(this.measuringInterval);
};

Measurer.prototype.conditionalTopVolumeTimeInsert = function () {
    var demoted;
    _.forEach(this.topVolumeTimeAlerts, function (topVolumeTime, idx) {
        console.log("this.topVolumeTimeAlerts: " + JSON.stringify(this.topVolumeTimeAlerts));
        console.log("this.volumeTimeSinceOverThreshold: " + JSON.stringify(this.volumeTimeSinceOverThreshold));
        if (demoted) {
            this.topVolumeTimeAlerts[idx] = demoted;
            demoted = topVolumeTime;
        } else if (this.volumeTimeSinceOverThreshold > topVolumeTime) {
            this.topVolumeTimeAlerts[idx] = this.volumeTimeSinceOverThreshold;
            this.emit('sendAlert', {
                volumeTime: this.volumeTimeSinceOverThreshold,
                timeLength: Date.now() - this.overThresholdSince,
                atTime: (new Date).toISOString()
            });
            if (topVolumeTime) { // only 'demote' if >0. else, exit loop
                demoted = topVolumeTime;
            } else {
                return false;
            }
        }
    }.bind(this));
};

Measurer.prototype.getSnapshot = function () {
    var snapshot = this.webrtc.getSnapshot();
    return _.merge(snapshot, {
        overThresholdSince: this.overThresholdSince,
        volumeTimeSinceOverThreshold: this.volumeTimeSinceOverThreshold,
        topVolumeTimeAlerts: this.topVolumeTimeAlerts
    });
};

Measurer.prototype.callback = function () {
    var snapshot = this.webrtc.getSnapshot(),
        time = Date.now();

    if (this.overThresholdSince) {
        if (snapshot.slowMeter < this.threshold) {
            this.conditionalTopVolumeTimeInsert();
            this.overThresholdSince = null;
            this.volumeTimeSinceOverThreshold = 0;
        } else if (this.previousMeasure) {
            var timeDelta = time - this.previousMeasure.time;
            console.log("timeDelta = " + timeDelta);
            console.log("this.volumeTimeSinceOverThreshold += " + timeDelta * snapshot.slowMeter);
            this.volumeTimeSinceOverThreshold += timeDelta * snapshot.slowMeter;
        }
    } else {
        if (snapshot.slowMeter >= this.threshold) {
            console.log("crossed threshold");
            this.overThresholdSince = time;
        }
    }

    this.previousMeasure = {
        time: time,
        snapshot: snapshot
    }
};

module.exports = Measurer;
