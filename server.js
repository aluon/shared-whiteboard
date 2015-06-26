var express = require('express');
var app = express();
app.use(express.static('public'));

var server = app.listen(8080);

var paths = {};

var io = require('socket.io').listen(server);
io.on('connection', function (socket) {
	var room = socket.id;
	console.log('client connected to room %s', room);

	socket.on('drawStart', function (path) {
		socket.broadcast.to(room).emit('drawStart', path);
	});

	socket.on('drawUpdate', function (path) {
		socket.broadcast.to(room).emit('drawUpdate', path);
	});

	socket.on('drawFinish', function (path) {
		paths[room] = paths[room] || [];
		paths[room].push(path);
	});

	socket.on('pathsNeeded', function () {
		console.log(paths[room]);
		socket.emit(paths[room]);
	});

	socket.on('joinRoom', function (id) {
		socket.leave(room);
		room = id || socket.id;
		socket.join(room);
	});
});
