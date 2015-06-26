var socket = io('localhost:8080');

tool.minDistance = 10;

socket.on('connect', function () {
	console.log('connected to whiteboard server');
});

var foreignPath;

socket.on('drawStart', function (path) {
	foreignPath = new Path().importJSON(path);
});

socket.on('drawUpdate', function(points) {
	for (var i = 0; i < points.length; ++i) {
		foreignPath.add(new Point(points[i]));
	}
	view.draw();
});

var path;
var updatePoints = [];
var updateTimer;

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

	updateTimer = setInterval(function () {
		socket.emit('drawUpdate', updatePoints);
		updatePoints = [];
	}, 10);
}

function onMouseDrag(e) {
	path.add(e.point);
	updatePoints.push([e.point.x, e.point.y]);
	path.smooth();
}

function onMouseUp(e) {
	clearInterval(updateTimer);
}
