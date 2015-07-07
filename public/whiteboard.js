var socket = io('http://localhost:8080');

var path;
var foreignPath;
var updatePoints = [];
var updateTimer;

socket.on('connect', function () {
	console.log('connected to whiteboard server');
	joinRoom();
});

socket.on('clearProject', clearProject);

socket.on('drawStart', function (path) {
	foreignPath = new Path().importJSON(path);
});

socket.on('drawUpdate', function (points) {
	if (!foreignPath) return;
	for (var i = 0; i < points.length; ++i) {
		foreignPath.add(new Point(points[i]));
	}
	view.update();
});

socket.on('pathsLoaded', function (paths) {
	clearProject();
	if (!paths) return;
	for (var i = 0; i < paths.length; ++i) {
		new Item().importJSON(paths[i]);
	}
	view.update();
});

$('#roomSelector').change(joinRoom);

$('#undoButton').click(function () {
	socket.emit('undo');
});

$('#clearProjectButton').click(sendClearProject);

$('#toolSelector').change(changeTool);

function clearProject() {
	path = foreignPath = null;
	project.clear();
	view.update();
}

function joinRoom() {
	socket.emit('joinRoom', $('#roomSelector').val());
}

function sendClearProject() {
	clearProject();
	socket.emit('clearProject');
}

function sendUpdatePoints() {
	if (!updatePoints.length) return;
	socket.emit('drawUpdate', updatePoints);
	updatePoints = [];
}

function changeTool() {
	var name = $('#toolSelector').val();
	var tool;
	switch (name) {
		case 'brush':
			tool = brushTool;
			break;
		case 'select':
			tool = selectTool;
			break;
		default:
			tool = brushTool;
	}
	tool.activate();
	tool.minDistance = 5;
}

var brushTool = new Tool();
var selectTool = new Tool();

brushTool.onMouseDown = function (e) {
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
};

brushTool.onMouseDrag = function (e) {
	path.add(e.point);
	updatePoints.push([e.point.x, e.point.y]);
	path.smooth();
};

brushTool.onMouseUp = function (e) {
	clearInterval(updateTimer);
	sendUpdatePoints();
	socket.emit('drawFinish', path);
};

selectTool.onMouseDown = function (e) {
	var hitResult = project.hitTest(e.point);
	if (!hitResult) return;
	selectTool.path = hitResult.item;
};

selectTool.onMouseDrag = function (e) {
	var path = selectTool.path;
	if (path) {
		path.position += e.delta;
	}
};

selectTool.onMouseUp = function (e) {
};
