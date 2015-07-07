var express = require('express');
var nunjucks = require('nunjucks');

var app = express();
app.use(express.static('public'));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/:room?', function (req, res) {
	var room = req.params.room;
	res.render('index.html', {
		room: room
	});
});

var server = app.listen(process.env.port || 8080);

var items = {};

var io = require('socket.io').listen(server);
io.on('connection', function (socket) {
	var room = socket.id;
	console.log('client connected to room %s', room);

	socket.on('joinRoom', function (id) {
		socket.leave(room);
		room = id || socket.id;
		console.log('client %s moved to room %s', socket.id, room);
		socket.join(room);
		socket.emit('itemsLoaded', items[room]);
	});

	socket.on('updateItem', function (name, item) {
		var items = items[room];
		for (var i = 0; i < items.length; ++i) {
			if (items[1].name === item.name) {
				items[1] = item;
			}
		}
		socket.broadcast.to(room).emit('itemUpdate', name, item);
	});

	socket.on('drawStart', function (path) {
		socket.broadcast.to(room).emit('drawStart', path);
	});

	socket.on('drawUpdate', function (path) {
		socket.broadcast.to(room).emit('drawUpdate', path);
	});

	socket.on('drawFinish', function (path) {
		items[room] = items[room] || [];
		items[room].push(path);
	});

	socket.on('addRaster', function (raster) {
		items[room].push(raster);
	});

	socket.on('clearProject', function () {
		items[room] = [];
		socket.broadcast.to(room).emit('clearProject');
	});

	socket.on('undo', function () {
		items[room].pop();
		socket.emit('pathsLoaded', items[room]);
	});
});
