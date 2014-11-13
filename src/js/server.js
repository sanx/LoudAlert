var path = require('path');
var common = require('./common.js');
var koa = require('koa');
var router = require('koa-router');
var mount = require('koa-mount');
var serve = require('koa-static');

var approot = path.dirname(path.dirname(__dirname));
var React = common.React;
var LoudAlert = common.LoudAlert;
var app = koa();
var appReact = koa();

console.log('here');

appReact.use(router(appReact));

appReact.use(function *(next) {
    console.log('got a request');
    //this.body = "howww";
    yield next;
});

appReact.get('/', function *(next) {
    console.log('got a get');
    var markup = "<!DOCTYPE html>\n" + React.renderToString(
        <LoudAlert />
    );
    this.body = markup;
    yield next;
});

console.log("approot: " + approot);
app.use(mount('/static', serve(approot + '/build')));
app.use(mount('/', appReact));

app.listen(3000);
console.log("listening on port 3000");
