var express = require('express');
var app = express();
app.use(express.static('public'));

var server = app.listen(8080);

var paths = [];

var io = require('socket.io').listen(server);
io.on('connection', function (socket) {
	console.log('client connected');

	socket.on('drawStart', function (path) {
		socket.broadcast.emit('drawStart', path);
	});

	socket.on('drawUpdate', function (path) {
		socket.broadcast.emit('drawUpdate', path);
	});

	socket.on('drawFinish', function(path) {
		paths.push(path);
	});

	socket.on('pathsNeeded', function(fn) {
		fn(paths);
	});
});
