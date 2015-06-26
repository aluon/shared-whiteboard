var socket = io('http://localhost:8080');

tool.minDistance = 5;

socket.on('connect', function () {
	console.log('connected to whiteboard server');
	socket.emit('pathsNeeded', loadPaths);
});

$('#roomSelector').change(function () {
	project.clear();
	view.update();
	socket.emit('joinRoom', this.value);
	socket.emit('pathsNeeded', loadPaths);
});

var foreignPath;

socket.on('drawStart', function (path) {
	foreignPath = new Path().importJSON(path);
});

socket.on('drawUpdate', function (points) {
	for (var i = 0; i < points.length; ++i) {
		foreignPath.add(new Point(points[i]));
	}
	view.update();
});

var path;
var updatePoints = [];
var updateTimer;

function loadPaths(paths) {
	if (!paths) return;
	for (var i = 0; i < paths.length; ++i) {
		new Path().importJSON(paths[i]);
	}
	view.update();
}

function sendUpdatePoints() {
	if (!updatePoints.length) return;
	socket.emit('drawUpdate', updatePoints);
	updatePoints = [];
}

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
	updateTimer = setInterval(sendUpdatePoints, 10);
}

function onMouseDrag(e) {
	path.add(e.point);
	updatePoints.push([e.point.x, e.point.y]);
	path.smooth();
}

function onMouseUp(e) {
	clearInterval(updateTimer);
	sendUpdatePoints();
	socket.emit('drawFinish', path);
}
