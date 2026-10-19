func run(api, image: Image, project, params: Dictionary):
	var root = 'C:/nikke-playground/docs/art/pixel/garden-body-sit-ne-v1/'
	var source = Image.load_from_file(root+'source-sit-ai.png')
	var palette_hex = JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json'))
	var palette = []
	for value in palette_hex:
		palette.append(Color(value))
	var result = api.create_image(96,96)
	var scale = 48.0 / 603.0
	for y in range(96):
		for x in range(96):
			var sx = int(floor((float(x)-48.0+0.5)/scale+618.5))
			var sy = int(floor((float(y)-5.0+0.5)/scale+115.0))
			if sx < 0 or sy < 0 or sx >= source.get_width() or sy >= source.get_height():
				continue
			var color = source.get_pixel(sx,sy)
			if color.a < 0.7:
				continue
			var best = palette[0]
			var distance = 99.0
			for candidate in palette:
				var d = pow(color.r-candidate.r,2)+pow(color.g-candidate.g,2)+pow(color.b-candidate.b,2)
				if d < distance:
					distance = d
					best = candidate
			result.set_pixel(x,y,best)
	result.save_png(root+'sit-ne.png')
	var mirrored = result.duplicate()
	mirrored.flip_x()
	mirrored.save_png(root+'sit-nw.png')
	# First create a 96x96 project, then run once per head/body layer with params.part.
	var part = str(params.get('part', 'full'))
	if part == 'head' or part == 'body':
		for y in range(96):
			if (y < 52) != (part == 'head'):
				for x in range(96):
					result.set_pixel(x,y,Color(0,0,0,0))
		result.save_png(root+'sit-'+part+'-ne.png')
		mirrored = result.duplicate()
		mirrored.flip_x()
		mirrored.save_png(root+'sit-'+part+'-nw.png')
	return result
