function onMouseDown(e) {
	console.log('mousedown');
	var path = new Path();
	path.fillColor = active_rgb_color;
	path.add(e.point);
}
