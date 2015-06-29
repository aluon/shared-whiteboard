var express = require('express');
var app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/:room?', function (req, res) {
	var room = req.params.room;
	res.render('index', {
		room: room
	});
});

var server = app.listen(process.env.port || 8080);

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

	socket.on('clearProject', function () {
		socket.broadcast.to(room).emit('clearProject');
	});

	socket.on('joinRoom', function (id) {
		socket.leave(room);
		room = id || socket.id;
		console.log('client %s moved to room %s', socket.id, room);
		socket.join(room);
		socket.emit('joinRoom', paths[room]);
	});
});
