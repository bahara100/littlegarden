# Separate rear standing draft. Approved front and all runtime originals are read-only.
var root='C:/nikke-playground/docs/art/pixel/scarlet2-base-v1/'
var out=root+'rear/'

func nearest(c:Color,palette:Array)->Color:
	var best=palette[0]
	var distance=99.0
	for p in palette:
		var d=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d<distance:
			distance=d
			best=p
	return best

func run(api,image:Image,project,params:Dictionary):
	var source=Image.load_from_file(out+'aligned-ai-ne.png')
	var base=Image.load_from_file(out+'base-padded-ne.png')
	var palette=[]
	for value in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):
		palette.append(Color(value))
	var upper=api.create_image(128,128)
	var garment=api.create_image(128,128)
	var legs=api.create_image(128,128)
	for y in range(128):
		for x in range(128):
			var c=source.get_pixel(x,y)
			if c.a<0.7: continue
			# Keep the bow/hip silhouette; replace AI shins and shoes with actual base feet.
			if y>=103 and x>=40 and x<=84: continue
			var dest=upper if y<79 else garment
			dest.set_pixel(x,y,nearest(c,palette))
	for y in range(99,128):
		for x in range(128):
			var c=base.get_pixel(x,y)
			if c.a<0.5: continue
			var v=(c.r+c.g+c.b)/3.0
			var skin=c.r>c.g+0.07 and c.r>c.b+0.04 and c.r>0.6
			var value='#f8f3ec'
			if not skin and v<0.35: value='#332c3c'
			elif v<0.55: value='#72667d'
			elif v<0.72: value='#b9b0c2'
			elif v<0.86: value='#ded6e2'
			# Seen from behind, the folded/striped boot is screen-left.
			if x<64 and y in [105,109] and (skin or v>0.55): value='#89808f'
			if x>=64 and y==112 and v>0.55: value='#dbc28f'
			legs.set_pixel(x,y,nearest(Color(value),palette))
	var full=legs.duplicate()
	full.blend_rect(garment,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.blend_rect(upper,Rect2i(0,0,128,128),Vector2i.ZERO)
	var parts={'legs':legs,'costume':garment,'upper':upper,'idle':full}
	for key in parts:
		parts[key].save_png(out+key+'-ne.png')
	return parts[str(params.get('part','idle'))]
