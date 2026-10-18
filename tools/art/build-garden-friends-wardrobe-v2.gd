# Native Pixelorama wardrobe compositing. Approved walk geometry stays in legs.png.
var root='C:/nikke-playground/docs/art/pixel/'
var out=root+'garden-friends-base-walk-v2/'
var old=root+'garden-friends-base-walk-v1/'

func nearest(c: Color, palette: Array, cache: Dictionary) -> Color:
	if c.a < 0.7:
		return Color.TRANSPARENT
	var key=c.to_rgba32()
	if cache.has(key):
		return cache[key]
	var best=palette[0]
	var distance=99.0
	for p in palette:
		var d=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d < distance:
			distance=d
			best=p
	cache[key]=best
	return best

func over(dst: Image, src: Image):
	for y in range(96):
		for x in range(96):
			if src.get_pixel(x,y).a > 0.5:
				dst.set_pixel(x,y,src.get_pixel(x,y))

func legs(api, base: Image) -> Image:
	var result=api.create_image(96,96)
	var shoe_map={'19011e':'352337','27052d':'352337','1d0126':'352337','3d173b':'51323c','593950':'60413e','695b74':'6e4740','867c91':'9b6b46','938a9a':'b88a5b','afa9b6':'c89c6c','bebac4':'ddba87','bab6c1':'ddba87','bfbbc5':'ddba87','7e606f':'a47f78','8d727c':'b38d7d'}
	for y in range(69,96):
		for x in range(96):
			var c=base.get_pixel(x,y)
			if c.a < 0.5:
				continue
			var hex=c.to_html(false)
			var value=shoe_map.get(hex,'')
			if value != '':
				result.set_pixel(x,y,Color('#'+value))
			else:
				if not (c.r > c.g+0.065 and c.r > c.b+0.04):
					var v=(c.r+c.g+c.b)/3.0
					result.set_pixel(x,y,Color('#352337' if v < 0.25 else '#6e4740' if v < 0.48 else '#9b6b46' if v < 0.64 else '#b88a5b' if v < 0.76 else '#ddba87'))
					continue
				# Exposed knees above the sock, light cream below; keep the original leg silhouette.
				var light=(c.r+c.g+c.b)/3.0
				result.set_pixel(x,y,Color(('#ffe1c1' if light > 0.8 else '#efb58f') if y < 78 else ('#fff0d8' if light > 0.8 else '#ddc2a0')))
	return result

func sample(api, src: Image, n: int, row: int, columns: int=4) -> Image:
	var result=api.create_image(96,96)
	var cw=src.get_width()/float(columns)
	var ch=src.get_height()/2.0
	for y in range(96):
		for x in range(96):
			result.set_pixel(x,y,src.get_pixel(int((n+(x+0.5)/96.0)*cw),int((row+(y+0.5)/96.0)*ch)))
	return result

func compose(api, base: Image, head: Image, dressed: Image, palette: Array, cache: Dictionary, pose_bob: int=0, leg_shift_x: int=0) -> Dictionary:
	var leg=legs(api,base)
	if leg_shift_x != 0:
		var shifted=leg.duplicate()
		shifted.fill_rect(Rect2i(0,75,96,21),Color.TRANSPARENT)
		shifted.blit_rect(leg,Rect2i(0,75,96,21),Vector2i(leg_shift_x,75))
		leg=shifted
	var costume=api.create_image(96,96)
	for y in range(52,77):
		for x in range(27,72):
			var c=dressed.get_pixel(x,y-pose_bob)
			if c.a < 0.7:
				continue
			costume.set_pixel(x,y,nearest(c,palette,cache))
	var result=leg.duplicate()
	over(result,costume)
	over(result,head)
	return {'full':result,'legs':leg,'costume':costume,'head':head}

func run(api, image: Image, project, params: Dictionary):
	var common=['#352337','#51323c','#60413e','#6e4740','#9b6b46','#b88a5b','#c89c6c','#ddba87','#a47f78','#b38d7d','#ffe1c1','#efb58f','#fff0d8','#ddc2a0','#e9d3b4','#c4a38a','#f5c3a2','#da9877','#ad6c5e']
	var colours={'momo':['#ffd8ba','#efb18d','#d78a6c','#b96c58','#8e4c46','#795240','#a3714e'], 'lulu':['#e2c7e5','#c3a1cc','#a47faf','#7f588c','#593c69','#d4d6aa','#b2bc8b','#8c9b70','#657450']}
	for who in ['momo','lulu']:
		DirAccess.make_dir_recursive_absolute(out+who)
		var palette=[]
		# Keep the old head pixels exactly, with a separate reserved wardrobe palette.
		for value in common+colours[who]:
			var c=Color(value)
			if not palette.has(c):
				palette.append(c)
		var cache={}
		var source=Image.load_from_file(out+'source-tailored-'+who+'.png')
		var editor=api.create_image(384,192)
		var layer_sheets={}
		for kind in ['legs','costume','head']:
			layer_sheets[kind]=api.create_image(384,192)
		for dir in ['se','ne']:
			var row=0 if dir=='se' else 1
			var sheet=api.create_image(384,96)
			var mirror=api.create_image(384,96)
			for n in range(1,5):
				var folder='garden-body-walk-se-v20' if dir=='se' else 'garden-body-walk-ne-v3'
				var base=Image.load_from_file(root+folder+'/frame-'+str(n)+'.png')
				var head=Image.load_from_file(old+who+'/head-'+dir+'-'+str(n)+'.png')
				var tailored=sample(api,source,n-1,row)
				var layers=compose(api,base,head,tailored,palette,cache)
				for kind in ['full','legs','costume','head']:
					layers[kind].save_png(out+who+'/'+kind+'-'+dir+'-'+str(n)+'.png')
					if layer_sheets.has(kind):
						layer_sheets[kind].blit_rect(layers[kind],Rect2i(0,0,96,96),Vector2i((n-1)*96,row*96))
				var full=layers.full
				sheet.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
				editor.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,row*96))
				var flip=full.duplicate()
				flip.flip_x()
				mirror.blit_rect(flip,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
				if n==1:
					# Neutral standing uses the same sewn torso/dress artwork, base legs, and its original head.
					var idle_base=Image.load_from_file(root+'garden-body-base-v2/base-idle-se.png') if dir=='se' else Image.load_from_file(old+'base-idle-ne.png')
					var idle_head=Image.load_from_file(old+who+'/head-'+dir+'.png')
					if dir=='ne':
						# Rear hair/nape centre was 5px ahead of the dress neck centre.
						# Translate the existing head intact, with no scaling or redraw.
						var centered_head=api.create_image(96,96)
						centered_head.blit_rect(idle_head,Rect2i(0,0,96,96),Vector2i(-5,0))
						idle_head=centered_head
					var idle_source=Image.load_from_file(out+'source-tailored-idle.png')
					var idle_tailored=sample(api,idle_source,row,0 if who=='momo' else 1,2)
					# Rear dress waist is ~5px screen-left of the mannequin's ankles.
					# Put legs under its pelvis, behind the hem; never move walking poses.
					var idle_layers=compose(api,idle_base,idle_head,idle_tailored,palette,cache,0,-5 if dir=='ne' else 0)
					for kind in ['legs','costume','head']:
						idle_layers[kind].save_png(out+who+'/idle-'+dir+'-'+kind+'.png')
					var idle=idle_layers.full
					idle.save_png(out+who+'/idle-'+dir+'.png')
					idle.flip_x()
					idle.save_png(out+who+'/idle-'+('sw' if dir=='se' else 'nw')+'.png')
				sheet.save_png(out+who+'/walk-'+dir+'.png')
				mirror.save_png(out+who+'/walk-'+('sw' if dir=='se' else 'nw')+'.png')
		editor.save_png(out+who+'/editor-sheet.png')
		for kind in ['legs','costume','head']:
			layer_sheets[kind].save_png(out+who+'/'+kind+'-editor-sheet.png')
		var proof=editor.duplicate()
		proof.resize(1536,768,Image.INTERPOLATE_NEAREST)
		proof.save_png(out+who+'/editor-proof-4x.png')
	return 'saved tailored clothing with original heads and base leg geometry'
