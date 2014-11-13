var React = require('react');

var LoudAlert = React.createClass({
    render: function () {
        return (
            <html>
            <head>
            <script src="/static/js/client.js" />
            </head>
            <body>
            hello!
            </body>
            </html>
        );
    }
});

module.exports.LoudAlert = LoudAlert;
module.exports.React = React;
