var _ = require('lodash');
var React = require('react');
var util = require('util');
var events = require('events');
var Measurer = require('./measurer.js');
var Q = require('q');
var request = require('browser-request');
var events = require('events');
var jquery = require('jquery');

Backbone.$ = jquery;

var Router = Backbone.Router.extend({
    routes: {
        "api_number/:api_number/api_key/:api_key": "setCredentials"
    },
    setCredentials: function (api_number, api_key) {
        SENDHUB_NUMBER = api_number;
        SENDHUB_API_KEY = api_key;
    }
});
this.router = new Router();
Backbone.history.start({
    pushState: false
});

var SENDHUB_NUMBER,
    SENDHUB_API_KEY;



var pRequest = Q.denodeify(request);
var webrtc = require('./webrtc.js');

measurer = new Measurer(webrtc, {
    freq: 200,
    timeToTrigger: 200,
    threshold: 0.01
});

eventEmitter = new events.EventEmitter();



var Contacts = React.createClass({displayName: 'Contacts',
    getInitialState: function () {
        return {
            contacts: {}
        };
    },
    componentWillMount: function () {
        this.refreshContacts();
        eventEmitter.on('contactsChanged', function () {
            this.refreshContacts();
        }.bind(this));
    },
    refreshContacts: function () {
        console.log("gonna request");
        pRequest({
            json: true,
            method: 'GET',
            url: util.format('https://cors-anywhere.herokuapp.com/https://api.sendhub.com/v1/contacts/?username=%s&api_key=%s', SENDHUB_NUMBER, SENDHUB_API_KEY),
            headers: {
                'origin': 'http://www.foo.com/'
            }})
            .then(function (res) {
                console.log("got response");
                if (200 !== res[0].statusCode) {
                    alert("error fetching contacts (status)");
                    throw Error("couldn't fetch contacts from Sendhub");
                }
                console.log("got success");
                var contacts = res[1];
                this.setState({
                    contacts: contacts
                });
                console.log(JSON.stringify(contacts));
            }.bind(this))
            .fail(function (reason) {
                alert("error fetching contacts (fail)");
                console.log("fail reason: " + reason);
                throw Error("failed with reason: " + reason);
            });
    },
    handleDelete: function (object) {
        pRequest({
            json: false,
            method: 'DELETE',
            url: util.format('https://cors-anywhere.herokuapp.com/https://api.sendhub.com/v1/contacts/%s/?username=%s&api_key=%s', object.id_str, SENDHUB_NUMBER, SENDHUB_API_KEY),
            headers: {
                'origin': 'http://www.foo.com/'
            }})
        .then(function (res) {
            if (204 !== res[0].statusCode) {
                alert("error deleting contact (code)");
                throw Error("error deleting contact");
            }
            eventEmitter.emit('contactsChanged');
        })
        .fail(function (reason) {
            alert("error deleting contact (fail)");
            console.log("reason: " + reason);
            throw Error("error deleting contact");
        });
    },
    handleSelectContact: function (object) {
        eventEmitter.emit('setAlertContact', object);
    },
    render: function () {
        //return <span> aah </span>;
        var rowElems = _.map(this.state.contacts.objects, function (object, idx) {
            return React.createElement("tr", {key: idx}, React.createElement("td", null, React.createElement("input", {type: "radio", name: "notify", onChange: this.handleSelectContact.bind(this, object)})), React.createElement("td", null, object.name), React.createElement("td", null, object.number), React.createElement("td", null, React.createElement("input", {type: "button", defaultValue: "Delete", onClick: this.handleDelete.bind(this, object)})))
        }.bind(this));
        return (
            React.createElement("section", {className: "Contacts"}, 
                React.createElement("h2", null, "Contacts"), 
                React.createElement(AddContact, null), 
                React.createElement("table", null, 
                    React.createElement("thead", null, 
                        React.createElement("tr", null, React.createElement("th", null, "Notify"), React.createElement("th", null, "Name"), React.createElement("th", null, "Number"), React.createElement("th", null))
                    ), 
                    React.createElement("tbody", null, 
                        rowElems
                    )
                )
            )
        );
    }
});

var AddContact = React.createClass({displayName: 'AddContact',
    getInitialState: function () {
        return {
            active: false
        };
    },
    handleActivateInputs: function () {
        this.setState({
            active: true
        });
    },
    handleCancel: function () {
        this.setState({
            active: false
        });
    },
    handleSave: function () {
        var newName = this.refs.newName.getDOMNode().value,
            newNumber = this.refs.newNumber.getDOMNode().value;
        pRequest({
            json: true,
            method: 'POST',
            url: util.format('https://cors-anywhere.herokuapp.com/https://api.sendhub.com/v1/contacts/?username=%s&api_key=%s', SENDHUB_NUMBER, SENDHUB_API_KEY),
            body: {
                name: newName,
                number: newNumber
            },
            headers: {
                'origin': 'http://www.foo.com/'
            }})
        .then(function (res) {
            if (201 !== res[0].statusCode) {
                alert("error saving new contact");
                throw Error("error saving new contact!");
            }
            alert("new contact was saved");
            this.setState({
                active: false
            });
            eventEmitter.emit("contactsChanged");
        }.bind(this))
        .fail(function (reason) {
            alert("error saving new contact");
            throw Error("error saving new contact");
        });
    },
    render: function () {
        if (!this.state.active) {
            return (
                React.createElement("section", {className: "addContact"}, 
                    React.createElement("input", {type: "button", defaultValue: "Add", onClick: this.handleActivateInputs, key: "activate"})
                )
            );
        } else {
            return (
                React.createElement("section", {className: "addContact"}, 
                    React.createElement("input", {type: "text", placeholder: "name", ref: "newName", key: "name"}), 
                    React.createElement("input", {type: "text", placeholder: "number", ref: "newNumber", key: "number"}), 
                    React.createElement("input", {type: "button", defaultValue: "Save", onClick: this.handleSave, key: "save"}), 
                    React.createElement("input", {type: "button", defaultValue: "Cancel", onClick: this.handleCancel, key: "cancel"})
                )
            );
        }
    }
});

var Controls = React.createClass({displayName: 'Controls',
    getInitialState: function () {
        measurer.setThreshold(0.1);
        measurer.setTimeToTrigger(1000);
        return {
            thresholdValue: 0.1,
            timeToTriggerValue: 1000
        };
    },
    onMicStatusChange: function (e) {
        var userActivated = e.target.checked;
        console.log("user requested active mic? " + userActivated);
        if (userActivated) {
            navigator.getUserMedia(webrtc.constraints, webrtc.successCallback, webrtc.errorCallback);
        } else {
            webrtc.stop();
        }
    },
    onThresholdChange: function (e) {
        var thresholdValue = e.target.value / 100;
        measurer.setThreshold(thresholdValue);
        this.setState({
            thresholdValue: thresholdValue
        });
    },
    onTimeToTriggerChange: function (e) {
        var timeToTriggerValue = e.target.value * 1000;
        measurer.setTimeToTrigger(timeToTriggerValue);
        this.setState({
            timeToTriggerValue: timeToTriggerValue
        });
    },
    render: function () {
        console.log('rendering Controls');
        return (
            React.createElement("div", null, 
            React.createElement("form", null, 
            React.createElement("fieldset", null, 
            React.createElement("legend", null, "Controls"), 
            React.createElement("label", null, 
                React.createElement("span", null, "Activate mic: "), 
                React.createElement("input", {type: "checkbox", onChange: this.onMicStatusChange, ref: "turnOnMic"})
            ), 
            React.createElement("label", null, 
                React.createElement("span", null, "Input threshold: "), 
                React.createElement("input", {type: "range", min: "0.1", max: "100", defaultValue: "100", step: "1", onChange: this.onThresholdChange, value: this.state.thresholdValue * 100}), 
                React.createElement("span", null, (this.state.thresholdValue).toFixed(2))
            ), 
            React.createElement("label", null, 
                React.createElement("span", null, "Time to trigger (s): "), 
                React.createElement("input", {type: "range", min: "0.1", max: "10", defaultValue: "10", step: "0.1", onChange: this.onTimeToTriggerChange, value: this.state.timeToTriggerValue / 1000}), 
                React.createElement("span", null, (this.state.timeToTriggerValue / 1000).toFixed(2))
            )
            )
            )
            )
        );
    }
});

var Status = React.createClass({displayName: 'Status',
    getInitialState: function () {
        return {
            soundLevel: 0,
            alert: false
        };
    },
    componentWillMount: function () {
        this.interval = setInterval(function () {
            var snapshot = webrtc.getSnapshot();
            this.setState({
                soundLevel: snapshot['slowMeter']
            });
        }.bind(this), 200);
        measurer.on('sendAlert', function () {
            this.setState({
                alert: true
            });
            setTimeout(function () {
                this.setState({
                    alert: false
                });
            }.bind(this), 1000);
        }.bind(this));
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
    },
    render: function () {
        var alertElem,
            displayedVolume = (this.state.soundLevel || 0) * 100,
            measurerSnapshot = measurer.getSnapshot(),
            overThresholdTime = (measurerSnapshot.overThresholdSince) ? Date.now() - measurerSnapshot.overThresholdSince : 0,
            displayedOverThesholdTime = overThresholdTime / 1000,
            displayedTopTimeVolume = measurerSnapshot.topVolumeTimeAlerts[0];
        if (this.state.alert) {
            alertElem = React.createElement("li", null, React.createElement("span", null, " alert "));
        }
        return (
            React.createElement("ul", null, 
                React.createElement("li", null, 
                    React.createElement("dl", null, 
                        React.createElement("dt", null, "volume (", displayedVolume/100, "): "), React.createElement("dd", null, React.createElement("progress", {max: "100", value: displayedVolume}, displayedVolume))
                    )
                ), 
                React.createElement("li", null, 
                    React.createElement("dl", null, 
                        React.createElement("dt", null, "time above threshold (", (displayedOverThesholdTime).toFixed(2), " s): "), React.createElement("dd", null, React.createElement("progress", {max: "100", value: displayedOverThesholdTime}, displayedOverThesholdTime))
                    )
                ), 
                alertElem, 
                React.createElement("li", null, 
                    React.createElement("h3", null, "Top energetic periods"), 
                    React.createElement(TopEnergeticPeriods, {measurerSnapshot: measurerSnapshot})
                )
            )
        );
    }
});

var TopEnergeticPeriods = React.createClass({displayName: 'TopEnergeticPeriods',
    getInitialState: function () {
        return {
        };
    },
    componentWillMount: function () {
    },
    render: function () {
        var periodsElems = _.map(this.props.measurerSnapshot.topVolumeTimeAlerts, function (energy, idx) {
            return (
                React.createElement("tr", {key: idx}, React.createElement("td", null, (energy).toFixed(2)))
            );
        });
        return (
            React.createElement("table", null, 
                React.createElement("thead", null, 
                    React.createElement("tr", null, React.createElement("th", null, "Energy"))
                ), 
                React.createElement("tbody", null, 
                    periodsElems
                )
            )
        );
    }
});

var Alerts = React.createClass({displayName: 'Alerts',
    getInitialState: function () {
        return {
            alertingContact: null,
            alerts: []
        }
    },
    sendAlert: function (alertInfo) {
        var contact;
        if (!this.state.alertingContact) {
            var alerts = this.state.alerts;
            alerts.push({
                volumeTime: alertInfo.volumeTime,
                timeLength: alertInfo.timeLength,
                atTime: alertInfo.atTime,
                number: "NONE!"
            });
            this.setState({
                alerts: alerts
            });
            return;
        }
        contact = this.state.alertingContact;
        pRequest({
            json: true,
            method: 'POST',
            url: util.format('https://cors-anywhere.herokuapp.com/https://api.sendhub.com/v1/messages/?username=%s&api_key=%s', SENDHUB_NUMBER, SENDHUB_API_KEY),
            body: {
                contacts: [contact.id_str],
                text: util.format("they're being too loud! %s Time*Vol, for: %s ms, at: %s", alertInfo.volumeTime, alertInfo.timeLength, alertInfo.atTime)
            },
            headers: {
                'origin': 'http://www.foo.com/'
            }})
        .then(function (res) {
            if (201 !== res[0].statusCode) {
                alert("failed sending alert");
                throw Error("failed sending alert");
            }
            alert("alert sent to #: " + contact.number);
            var alerts = this.state.alerts;
            alerts.push({
                volumeTime: alertInfo.volumeTime,
                timeLength: alertInfo.timeLength,
                atTime: alertInfo.atTime,
                number: contact.number
            });
            this.setState({
                alerts: alerts
            });
        }.bind(this))
        .fail(function (reason) {
            alert("failed sending alert");
            alert("reason: " + reason);
            throw Error("failed sending alert");
        });
    },
    componentWillMount: function () {
        eventEmitter.on('setAlertContact', function (object) {
            console.log("now alerting number: " + object.number);
            this.setState({
                alertingContact: object
            });
        }.bind(this));
        measurer.on('sendAlert', function (alertInfo) {
            console.log("gotta alert!");
            this.sendAlert(alertInfo);
        }.bind(this));
    },
    render: function () {
        var alertElems = _.map(this.state.alerts.reverse(), function (alertInfo, idx) {
            return (
                React.createElement("tr", {key: idx}, React.createElement("td", null, (alertInfo.volumeTime).toFixed(2)), React.createElement("td", null, (alertInfo.timeLength).toFixed(2)), React.createElement("td", null, alertInfo.atTime), React.createElement("td", null, alertInfo.number))
            );
        });
        return (
            React.createElement("section", {className: "Alerts"}, 
            React.createElement("h2", null, "Alerts"), 
            React.createElement("table", null, 
                React.createElement("thead", null, 
                    React.createElement("tr", null, React.createElement("th", null, "Volume*Time"), React.createElement("th", null, "Time"), React.createElement("th", null, "At"), React.createElement("th", null, "Alerted #"))
                ), 
                React.createElement("tbody", null, 
                    alertElems
                )
            )
            )
        );
    }
});

var Credentials = React.createClass({displayName: 'Credentials',
    getInitialState: function () {
        return {
            api_number: SENDHUB_NUMBER,
            api_key: SENDHUB_API_KEY
        };
    },
    componentWillMount: function () {
        var Router = Backbone.Router.extend({
            routes: {
                "api_number/:api_number/api_key/:api_key": "setCredentials"
            },
            setCredentials: function (api_number, api_key) {
                SENDHUB_NUMBER = api_number;
                SENDHUB_API_KEY = api_key;
                this.setState({
                    api_number: api_number,
                    api_key: api_key
                });
            }.bind(this)
        });
        this.router = new Router();
        Backbone.history.start({
            pushState: false
        });
    },
    handleSetCredentials: function () {
        var api_number = this.refs.api_number.getDOMNode().value,
            api_key = this.refs.api_key.getDOMNode().value;
        this.router.navigate('api_number/' + api_number + '/api_key/' + api_key, {trigger: true});
    },
    render: function () {
        return (
            React.createElement("form", null, 
            React.createElement("fieldset", null, 
                React.createElement("legend", null, "Sendhub credentials"), 
                React.createElement("input", {type: "text", placeholder: "api phone #", ref: "api_number"}), 
                React.createElement("input", {type: "text", placeholder: "api key", ref: "api_key"}), 
                React.createElement("input", {type: "button", placeholder: "api key", onClick: this.handleSetCredentials})
            )
            )
        );
    }
});

/*React.render(
    <Credentials />,
    document.getElementById('Credentials')
);*/
React.render(
    React.createElement(Controls, null),
    document.getElementById('Controls')
);
React.render(
    React.createElement(Status, null),
    document.getElementById('Status'));
React.render(
    React.createElement(Contacts, null),
    document.getElementById('Contacts'));
React.render(
    React.createElement(Alerts, null),
    document.getElementById('Alerts'));



