var path;

function onMouseDown(e) {
	console.log(path);
	path = new Path();
	path.strokeColor = $('#colorSelector').val();
	path.add(e.point);
}

function onMouseDrag(e) {
	path.add(e.point);
}
