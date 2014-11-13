var React = require('react');

var LoudAlert = React.createClass({displayName: 'LoudAlert',
    render: function () {
        return (
            React.createElement("html", null, 
            React.createElement("head", null, 
            React.createElement("script", {src: "/static/js/client.js"})
            ), 
            React.createElement("body", null, 
            "hello!"
            )
            )
        );
    }
});

module.exports.LoudAlert = LoudAlert;
module.exports.React = React;
