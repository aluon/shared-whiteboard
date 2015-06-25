var socket = io('localhost:8080');

tool.minDistance = 10;

socket.on('connect', function () {
	console.log('connected to whiteboard server');
});

var foreignPath;

socket.on('drawStart', function (path) {
	foreignPath = new Path().importJSON(path);
});

socket.on('drawUpdate', function(path) {
	foreignPath = new Path().importJSON(path);
});

var path;

function onMouseDown(e) {
	path = new Path();
	if ($('#toolSelector').val() === "brush") {
		path.strokeColor = $('#colorSelector').val();
	} else {
		path.strokeColor = '#FFFFFF';
	}
	path.strokeWidth = $('#widthSelector').val();
	path.strokeCap = 'round';
	path.add(e.point);
	path.smooth();

	socket.emit('drawStart', path);
}

function onMouseDrag(e) {
	path.add(e.point);
	path.smooth();

	socket.emit('drawUpdate', path);
}
