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

	socket.on('itemUpdate', function (item) {
		for (var i = 0; i < items[room].length; ++i) {
			if (items[room][i][1].name === item[1].name) {
				items[room][i] = item;
				break;
			}
		}
		socket.broadcast.to(room).emit('itemUpdate', item);
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

	socket.on('rasterAdd', function (raster) {
		items[room] = items[room] || [];
		items[room].push(raster);
		socket.broadcast.to(room).emit('rasterAdd', raster);
	});

	socket.on('projectClear', function () {
		items[room] = [];
		socket.broadcast.to(room).emit('projectClear');
	});

	socket.on('undo', function () {
		items[room].pop();
		socket.emit('pathsLoaded', items[room]);
	});
});
