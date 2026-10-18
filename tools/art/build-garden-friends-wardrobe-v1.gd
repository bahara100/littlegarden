# Run through Pixelorama MCP eval_gdscript; paints clothing on existing whole poses.
var root = 'C:/nikke-playground/docs/art/pixel/garden-friends-base-walk-v1/'

func nearest(c: Color, palette: Array, cache: Dictionary) -> Color:
	if c.a < 0.7:
		return Color.TRANSPARENT
	var key = c.to_rgba32()
	if cache.has(key):
		return cache[key]
	var best = palette[0]
	var distance = 99.0
	for p in palette:
		var d = pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d < distance:
			distance = d
			best = p
	cache[key] = best
	return best

func quantize(im: Image, palette: Array, cache: Dictionary) -> Image:
	var result = im.duplicate()
	for y in range(result.get_height()):
		for x in range(result.get_width()):
			result.set_pixel(x,y,nearest(im.get_pixel(x,y),palette,cache))
	return result

func over(dst: Image, src: Image, offset: Vector2i):
	for y in range(src.get_height()):
		for x in range(src.get_width()):
			var p = Vector2i(x,y)+offset
			var c = src.get_pixel(x,y)
			if p.x >= 0 and p.y >= 0 and p.x < dst.get_width() and p.y < dst.get_height() and c.a > 0.7:
				dst.set_pixelv(p,c)

func shade(v: float, colours: Array) -> Color:
	if v > 0.9:
		return Color(colours[0])
	if v > 0.7:
		return Color(colours[1])
	if v > 0.48:
		return Color(colours[2])
	return Color(colours[3])

func skin(c: Color) -> bool:
	return c.r > c.g+0.065 and c.r > c.b+0.04

func head_template(api, cfg: Dictionary, who: String, dir: String, palette: Array, cache: Dictionary) -> Image:
	if dir == 'se':
		return quantize(Image.load_from_file('C:/nikke-playground/docs/art/pixel/garden-body-base-v1/'+who+'-head.png'),palette,cache)
	var src = Image.load_from_file(root+'source-back-heads.png')
	var rect = cfg.backHeadRect
	var scale = float(cfg.headTargetWidth)/float(rect[2])
	var height = int(round(float(rect[3])*scale))
	var top = 55-height
	var left = int(round(float(cfg.headTargetCenterX)-float(cfg.headTargetWidth)/2.0))
	var result = api.create_image(96,96)
	for y in range(height):
		for x in range(int(cfg.headTargetWidth)):
			var sx = int(rect[0])+int(floor((x+0.5)/scale))
			var sy = int(rect[1])+int(floor((y+0.5)/scale))
			result.set_pixel(left+x,top+y,nearest(src.get_pixel(sx,sy),palette,cache))
	return result

func paint(api, base: Image, head: Image, ref: Image, cfg: Dictionary, dir: String, palette: Array, cache: Dictionary) -> Dictionary:
	var top = 96
	for y in range(30):
		for x in range(96):
			if base.get_pixel(x,y).a > 0.5:
				top = min(top,y)
	var bob = top-(3 if dir == 'se' else 2)
	var hand_y = [54,54]
	for y in range(52,69):
		for x in range(96):
			var c = base.get_pixel(x,y)
			if c.a > 0.5 and skin(c) and (x < 43 or x > 58):
				var side = 0 if x < 43 else 1
				hand_y[side] = max(hand_y[side],y)
	var motion = api.create_image(96,96)
	var sleeve = cfg.sleeve
	var bodice = cfg.bodice
	var sock = ['#fff0d8','#f2d4b5','#c49b84','#865f64']
	var shoes = ['#c39b64','#88603f','#614037','#392438']
	var flesh = ['#ffe4c7','#ffd5af','#e4a483','#9f6a69']
	for y in range(48,96):
		for x in range(96):
			var c = base.get_pixel(x,y)
			if c.a < 0.5:
				continue
			var v = (c.r+c.g+c.b)/3.0
			var ink = c.r+c.g+c.b < 0.56
			var arm = y < 69 and (x < 43 or x > 58)
			var side = 0 if x < 43 else 1
			var colour = Color(cfg.ink)
			if not ink:
				if skin(c):
					if arm and y < hand_y[side]-2:
						colour = shade(v,sleeve)
					elif arm and y == hand_y[side]-2:
						colour = Color('#fff0d8')
					elif y >= 76:
						colour = shade(v,sock)
					else:
						colour = shade(v,flesh)
				elif y >= 74:
					colour = shade(v,shoes)
				else:
					colour = shade(v,sleeve if arm else bodice)
			motion.set_pixel(x,y,nearest(colour,palette,cache))
	var result = motion.duplicate()
	var costume = api.create_image(96,96)
	# Reuse only the skirt: original sleeves and clasped hands are deliberately excluded.
	for y in range(67,77):
		for x in range(20,79):
			var c = ref.get_pixel(x,y)
			var py = y+bob
			if c.a > 0.7 and py >= 0 and py < 96:
				costume.set_pixel(x,py,nearest(c,palette,cache))
	# Small cream collar; Momo's buttons are only on the front.
	for y in range(54+bob,56+bob):
		for x in [44,45,46,47,53,54,55,56]:
			if motion.get_pixel(x,y).a > 0.5:
				costume.set_pixel(x,y,nearest(Color('#fff0d8'),palette,cache))
	if dir == 'se':
		for y in [57+bob,60+bob,63+bob]:
			if motion.get_pixel(51,y).a > 0.5:
				costume.set_pixel(51,y,nearest(Color(cfg.ink),palette,cache))
	else:
		# The existing dress's side ribbon becomes a small visible rear-waist ribbon.
		for y in range(53,68):
			for x in range(26,40):
				var c = ref.get_pixel(x,y)
				if c.a > 0.7 and c.r < 0.55 and c.g < 0.35 and c.b < 0.48:
					costume.set_pixel(43+int((x-26)*0.75),61+bob+int((y-53)*0.6),nearest(c,palette,cache))
	over(result,costume,Vector2i.ZERO)
	# Moving hands/sleeves remain in front of the skirt where they overlap it.
	for y in range(52,69):
		for x in range(96):
			if (x < 40 or x > 60) and motion.get_pixel(x,y).a > 0.5:
				result.set_pixel(x,y,motion.get_pixel(x,y))
	var head_pose = api.create_image(96,96)
	over(head_pose,head,Vector2i(0,bob))
	over(result,head_pose,Vector2i.ZERO)
	return {'full':result,'motion':motion,'costume':costume,'head':head_pose}

func run(api, image: Image, project, params: Dictionary):
	var config = JSON.parse_string(FileAccess.get_file_as_string(root+'appearance-config.json'))
	var base_palette = []
	for value in JSON.parse_string(FileAccess.get_file_as_string('C:/nikke-playground/docs/art/pixel/garden-body-walk-se-v20/palette.json')):
		base_palette.append(Color(value))
	var idle_src = Image.load_from_file(root+'source-idle-ne.png')
	var ic = config.idleNe
	var idle_ne = api.create_image(96,96)
	var idle_cache = {}
	for y in range(96):
		for x in range(96):
			var sx = int(floor((x-48+0.5)/float(ic.scale)+float(ic.headCenterX)))
			var sy = int(floor((y-int(ic.targetHeadTop)+0.5)/float(ic.scale)+float(ic.sourceTop)))
			if sx >= 0 and sy >= 0 and sx < idle_src.get_width() and sy < idle_src.get_height():
				idle_ne.set_pixel(x,y,nearest(idle_src.get_pixel(sx,sy),base_palette,idle_cache))
	idle_ne.save_png(root+'base-idle-ne.png')
	var preview = api.create_image(96,96)
	for who in ['momo','lulu']:
		var cfg = config.characters[who]
		var palette = []
		for value in cfg.palette:
			palette.append(Color(value))
		var cache = {}
		DirAccess.make_dir_recursive_absolute(root+who)
		var ref = Image.load_from_file('C:/nikke-playground/docs/art/pixel/garden-body-base-v1/reference-'+who+'.png')
		var editor = api.create_image(384,192)
		for dir in ['se','ne']:
			var head = head_template(api,cfg,who,dir,palette,cache)
			head.save_png(root+who+'/head-'+dir+'.png')
			var sheet = api.create_image(384,96)
			var mirror_sheet = api.create_image(384,96)
			var mirror_dir = 'sw' if dir == 'se' else 'nw'
			for n in range(1,5):
				var folder = 'garden-body-walk-se-v20' if dir == 'se' else 'garden-body-walk-ne-v3'
				var base = Image.load_from_file('C:/nikke-playground/docs/art/pixel/'+folder+'/frame-'+str(n)+'.png')
				var layers = paint(api,base,head,ref,cfg,dir,palette,cache)
				for kind in ['full','motion','costume','head']:
					layers[kind].save_png(root+who+'/'+kind+'-'+dir+'-'+str(n)+'.png')
				var full = layers.full
				sheet.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
				editor.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0 if dir == 'se' else 96))
				var flipped = full.duplicate()
				flipped.flip_x()
				mirror_sheet.blit_rect(flipped,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
				if who == 'momo' and dir == 'se' and n == 1:
					preview = full.duplicate()
				sheet.save_png(root+who+'/walk-'+dir+'.png')
				mirror_sheet.save_png(root+who+'/walk-'+mirror_dir+'.png')
			var idle_base = Image.load_from_file('C:/nikke-playground/docs/art/pixel/garden-body-base-v2/base-idle-se.png') if dir == 'se' else idle_ne
			var idle_layers = paint(api,idle_base,head,ref,cfg,dir,palette,cache)
			idle_layers.full.save_png(root+who+'/idle-'+dir+'.png')
			var idle_flip = idle_layers.full.duplicate()
			idle_flip.flip_x()
			idle_flip.save_png(root+who+'/idle-'+mirror_dir+'.png')
		editor.save_png(root+who+'/editor-sheet.png')
	return preview
