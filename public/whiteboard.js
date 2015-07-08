var socket = io('http://localhost:8080');

var path;
var foreignPath;
var updateSegments = [];
var sendSegmentsTimer;
var sendMovesTimer;
var sendResizesTimer;
var updateInterval = 25;

socket.on('connect', function () {
	console.log('connected to whiteboard server');
	joinRoom();
});

socket.on('projectClear', clearProject);

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

socket.on('itemsLoaded', function (items) {
	clearProject();
	if (!items) return;
	for (var i = 0; i < items.length; ++i) {
		parseItem(items[i]);
	}
	view.update();
});

socket.on('itemUpdate', function (item) {
	project.activeLayer[item.name] = parseItem(item);
});

socket.on('rasterAdd', function (raster) {
	new Raster().importJSON(raster);
	view.update();
});

$('#roomSelector').change(joinRoom);

$('#undoButton').click(function () {
	socket.emit('undo');
});

$('#clearProjectButton').click(sendClearProject);

$('#imageInput').change(function () {
	var reader = new FileReader();
	reader.onloadend = function () {
		var raster = new Raster(reader.result);
		raster.name = generateName();
		socket.emit('rasterAdd', raster);
	};

	var file = this.files[0];
	if (file) {
		reader.readAsDataURL(file);
	}
});

var brushTool = new Tool();
var selectTool = new Tool();

$('#toolSelector').change(function () {
	var name = this.value;
	project.deselectAll();
	var tool;
	switch (name) {
		case 'brush':
			tool = brushTool;
			break;
		case 'select':
			tool = selectTool;
			project.selectAll();
			break;
		default:
			tool = brushTool;
	}
	tool.activate();
	tool.minDistance = 5;
}).trigger('change');

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

function sendUpdateSegments() {
	if (!updateSegments.length) return;
	socket.emit('drawUpdate', updateSegments);
	updateSegments = [];
}

function generateName() {
	return 'item' + new Date().getUTCMilliseconds();
}

function parseItem(item) {
	if (item[0] == "Raster") {
		return new Raster().importJSON(item);
	} else {
		return new Item().importJSON(item);
	}
}

brushTool.onMouseDown = function (e) {
	path = new Path();
	path.name = generateName();
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
	sendSegmentsTimer = setInterval(sendUpdateSegments, updateInterval);
};

brushTool.onMouseDrag = function (e) {
	path.add(e.point);
	updateSegments.push([e.point.x, e.point.y]);
	path.smooth();
};

brushTool.onMouseUp = function (e) {
	clearInterval(sendSegmentsTimer);
	sendUpdateSegments();
	socket.emit('drawFinish', path);
};

var hitOptions = {
	tolerance: 5,
	bounds: true
};

selectTool.onMouseDown = function (e) {
	selectTool.hitResult = project.hitTest(e.point, hitOptions);
};

selectTool.onMouseMove = function (e) {
	/*
	project.activeLayer.selected = false;
	if (e.item) {
		e.item.selected = true;
	}
	*/
};

selectTool.onMouseDrag = function (e) {
	if (!selectTool.hitResult) return;
	var type = selectTool.hitResult.type;
	var name = selectTool.hitResult.name;
	var item = selectTool.hitResult.item;
	var bounds = item.bounds;
	if (type == 'bounds') {
		if (name == 'top-left') {
			bounds.topLeft = e.point;
		} else if (name == 'top-right') {
			bounds.topRight = e.point;
		} else if (name == 'bottom-left') {
			bounds.bottomLeft = e.point;
		} else if (name == 'bottom-right') {
			bounds.bottomRight = e.point;
		} else if (name == 'left-center') {
			bounds.leftCenter.x = e.point.x;
		} else if (name == 'top-center') {
			bounds.topCenter.y = e.point.y;
		} else if (name == 'right-center') {
			bounds.rightCenter.x = e.point.x;
		} else if (name == 'bottom-center') {
			bounds.bottomCenter.y = e.point.y;
		}
	} else {
		item.position = e.point;
	}
};

selectTool.onMouseUp = function (e) {
	if (!selectTool.hitResult) return;
	console.log(selectTool.hitResult.item);
	socket.emit('itemUpdate', selectTool.hitResult.item);
};
