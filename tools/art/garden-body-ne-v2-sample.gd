func run(api, image: Image, project, params: Dictionary):
	var root = 'C:/nikke-playground/docs/art/pixel/garden-body-walk-ne-v2/'
	var layout = JSON.parse_string(FileAccess.get_file_as_string(root+'source-layout.json'))
	var config = layout.frames[int(params.number)-1]
	var source = Image.load_from_file(root+config.path)
	var palette_hex = JSON.parse_string(FileAccess.get_file_as_string('C:/nikke-playground/docs/art/pixel/garden-body-walk-se-v20/palette.json'))
	var palette = []
	for value in palette_hex:
		palette.append(Color(value))
	var result = api.create_image(96,96)
	var scale = float(config.scale)
	for y in range(96):
		for x in range(96):
			var sx = int(floor((float(x)-float(config.targetHeadCenterX)+0.5)/scale+float(config.headCenterX)))
			var sy = int(floor((float(y)-float(config.targetHeadTop)+0.5)/scale+float(config.sourceTop)))
			if sx < 0 or sy < 0 or sx >= int(config.rect[2]) or sy >= int(config.rect[3]):
				continue
			var color = source.get_pixel(sx+int(config.rect[0]),sy+int(config.rect[1]))
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
	result.save_png(root+'frame-'+str(int(params.number))+'-native.png')
	var mirrored = result.duplicate()
	mirrored.flip_x()
	mirrored.save_png(root+'frame-'+str(int(params.number))+'-nw-native.png')
	return result
