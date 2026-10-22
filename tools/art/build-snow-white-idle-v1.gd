# Native Pixelorama normalization of a coherent generated full-body sprite.
# No limb splicing. Split only for convenient editing after whole-body alignment.
var root = 'C:/nikke-playground/docs/art/pixel/snow-white-idle-v1/'

func run(api, image:Image, project, params:Dictionary):
	var dir = str(params.get('dir','se'))
	var src = Image.load_from_file(root+'source-ai.png')
	var rect = Rect2i(309,39,469,832) if dir=='se' else Rect2i(953,50,451,817)
	var size = Vector2i(58,102) if dir=='se' else Vector2i(56,100)
	var cropped = src.get_region(rect)
	cropped.resize(size.x,size.y,Image.INTERPOLATE_NEAREST)
	var left = 29 if dir=='se' else 33
	var top = 115-size.y
	var palette = []
	for hex in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):
		palette.append(Color(hex))
	var full = api.create_image(128,128)
	var aligned = api.create_image(128,128)
	var cache = {}
	for y in range(size.y):
		for x in range(size.x):
			var c = cropped.get_pixel(x,y)
			if c.a<0.72: continue
			c.a=1
			aligned.set_pixel(left+x,top+y,c)
			var key = c.to_rgba32()
			if not cache.has(key):
				var score = 100.0
				var best = palette[0]
				for p in palette:
					var d = pow(c.r-p.r,2)*0.3 + pow(c.g-p.g,2)*0.5 + pow(c.b-p.b,2)*0.2
					if d<score:
						score=d
						best=p
				cache[key]=best
			full.set_pixel(left+x,top+y,cache[key])
	var head = api.create_image(128,128)
	var body = api.create_image(128,128)
	for y in range(128):
		for x in range(128):
			var target = head if y<80 else body
			target.set_pixel(x,y,full.get_pixel(x,y))
	var mirror = full.duplicate()
	mirror.flip_x()
	mirror.save_png(root+'idle-'+('sw' if dir=='se' else 'nw')+'.png')
	aligned.save_png(root+'reference-'+dir+'.png')
	for item in [['idle',full],['head',head],['body',body]]:
		item[1].save_png(root+str(item[0])+'-'+dir+'.png')
	var preview = full.duplicate()
	preview.resize(512,512,Image.INTERPOLATE_NEAREST)
	preview.save_png(root+'preview-'+dir+'-4x.png')
	return head if str(params.get('part','body'))=='head' else body
