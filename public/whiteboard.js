var socket = io('localhost:8080');

socket.on('connect', function () {
	console.log('connected to whiteboard server');
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
}

function onMouseDrag(e) {
	path.add(e.point);
}
