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



var Contacts = React.createClass({
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
            return <tr key={idx}><td><input type="radio" name="notify" onChange={this.handleSelectContact.bind(this, object)}/></td><td>{object.name}</td><td>{object.number}</td><td><input type="button" defaultValue="Delete" onClick={this.handleDelete.bind(this, object)}/></td></tr>
        }.bind(this));
        return (
            <section className="Contacts">
                <h2>Contacts</h2>
                <AddContact />
                <table>
                    <thead>
                        <tr><th>Notify</th><th>Name</th><th>Number</th><th></th></tr>
                    </thead>
                    <tbody>
                        {rowElems}
                    </tbody>
                </table>
            </section>
        );
    }
});

var AddContact = React.createClass({
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
                <section className="addContact">
                    <input type="button" defaultValue="Add" onClick={this.handleActivateInputs} key="activate"/>
                </section>
            );
        } else {
            return (
                <section className="addContact">
                    <input type="text" placeholder="name" ref="newName" key="name"/>
                    <input type="text" placeholder="number" ref="newNumber" key="number"/>
                    <input type="button" defaultValue="Save" onClick={this.handleSave} key="save"/>
                    <input type="button" defaultValue="Cancel" onClick={this.handleCancel} key="cancel"/>
                </section>
            );
        }
    }
});

var Controls = React.createClass({
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
            <div>
            <form>
            <fieldset>
            <legend>Controls</legend>
            <label>
                <span>Activate mic: </span>
                <input type="checkbox" onChange={this.onMicStatusChange} ref="turnOnMic"/>
            </label>
            <label>
                <span>Input threshold: </span>
                <input type="range" min="1" max="100" defaultValue="100" step="1" onChange={this.onThresholdChange} value={this.state.thresholdValue * 100}/>
                <span>{(this.state.thresholdValue).toFixed(2)}</span>
            </label>
            <label>
                <span>Time to trigger (s): </span>
                <input type="range" min="0.1" max="10" defaultValue="10" step="0.1" onChange={this.onTimeToTriggerChange} value={this.state.timeToTriggerValue / 1000}/>
                <span>{(this.state.timeToTriggerValue / 1000).toFixed(2)}</span>
            </label>
            </fieldset>
            </form>
            </div>
        );
    }
});

var Status = React.createClass({
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
            alertElem = <li><span> alert </span></li>;
        }
        return (
            <ul>
                <li>
                    <dl>
                        <dt>volume ({displayedVolume/100}): </dt><dd><progress max="100" value={displayedVolume}>{displayedVolume}</progress></dd>
                    </dl>
                </li>
                <li>
                    <dl>
                        <dt>time above threshold ({(displayedOverThesholdTime).toFixed(2)} s): </dt><dd><progress max="100" value={displayedOverThesholdTime}>{displayedOverThesholdTime}</progress></dd>
                    </dl>
                </li>
                {alertElem}
                <li>
                    <h3>Top energetic periods</h3>
                    <TopEnergeticPeriods measurerSnapshot={measurerSnapshot}/>
                </li>
            </ul>
        );
    }
});

var TopEnergeticPeriods = React.createClass({
    getInitialState: function () {
        return {
        };
    },
    componentWillMount: function () {
    },
    render: function () {
        var periodsElems = _.map(this.props.measurerSnapshot.topVolumeTimeAlerts, function (energy, idx) {
            return (
                <tr key={idx}><td>{(energy).toFixed(2)}</td></tr>
            );
        });
        return (
            <table>
                <thead>
                    <tr><th>Energy</th></tr>
                </thead>
                <tbody>
                    {periodsElems}
                </tbody>
            </table>
        );
    }
});

var Alerts = React.createClass({
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
                <tr key={idx}><td>{(alertInfo.volumeTime).toFixed(2)}</td><td>{(alertInfo.timeLength).toFixed(2)}</td><td>{alertInfo.atTime}</td><td>{alertInfo.number}</td></tr>
            );
        });
        return (
            <section className="Alerts">
            <h2>Alerts</h2>
            <table>
                <thead>
                    <tr><th>Volume*Time</th><th>Time</th><th>At</th><th>Alerted #</th></tr>
                </thead>
                <tbody>
                    {alertElems}
                </tbody>
            </table>
            </section>
        );
    }
});

var Credentials = React.createClass({
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
            <form>
            <fieldset>
                <legend>Sendhub credentials</legend>
                <input type="text" placeholder="api phone #" ref="api_number"/>
                <input type="text" placeholder="api key" ref="api_key"/>
                <input type="button" placeholder="api key" onClick={this.handleSetCredentials}/>
            </fieldset>
            </form>
        );
    }
});

/*React.render(
    <Credentials />,
    document.getElementById('Credentials')
);*/
React.render(
    <Controls />,
    document.getElementById('Controls')
);
React.render(
    <Status />,
    document.getElementById('Status'));
React.render(
    <Contacts />,
    document.getElementById('Contacts'));
React.render(
    <Alerts />,
    document.getElementById('Alerts'));



