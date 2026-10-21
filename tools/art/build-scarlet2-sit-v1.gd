# Seated wardrobe pass. Read standing heads/palette and common seated feet; write new sitting files only.
var root='C:/nikke-playground/docs/art/pixel/scarlet2-sit-v1/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v1/'

func nearest(c:Color,palette:Array)->Color:
	var best=palette[0]
	var score=99.0
	for p in palette:
		var d=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d<score:
			score=d
			best=p
	return best

func run(api,image:Image,project,params:Dictionary):
	var dir=str(params.get('dir','se'))
	var source=Image.load_from_file(root+'aligned-costume-'+dir+'.png')
	var base=Image.load_from_file(root+'base-sit-'+dir+'.png')
	var head=Image.load_from_file(root+'head-'+dir+'.png')
	var palette=[]
	for value in JSON.parse_string(FileAccess.get_file_as_string(standing+'palette.json')):
		palette.append(Color(value))
	var costume=api.create_image(128,128)
	for y in range(76,128):
		for x in range(128):
			var c=source.get_pixel(x,y)
			if c.a<0.7: continue
			if dir=='se' and y>=102 and x<86: continue
			# Keep the common rear folded thigh, shin and shoes, rather than AI replacements.
			if dir=='ne':
				if y>=91 and x>=77: continue
				if y>=99 and x>=70: continue
				if y>=103: continue
			costume.set_pixel(x,y,nearest(c,palette))
	var legs=api.create_image(128,128)
	for y in range(90,128):
		for x in range(128):
			if dir=='se' and y<94: continue
			if dir=='ne' and not ((y>=90 and x>=77) or y>=100): continue
			var c=base.get_pixel(x,y)
			if c.a<0.5: continue
			var v=(c.r+c.g+c.b)/3.0
			var skin=c.r>c.g+0.07 and c.r>c.b+0.04 and c.r>0.6
			var value='#f8f3ec'
			if skin and y<102: value='#ffe1c1' if v>0.8 else '#efb58f'
			elif not skin and v<0.35: value='#332c3c'
			elif v<0.55: value='#72667d'
			elif v<0.72: value='#b9b0c2'
			elif v<0.86: value='#ded6e2'
			var folded=x>=69 if dir=='se' else x<75
			if folded and y in [105,108] and (skin or v>0.55): value='#89808f'
			if not folded and y==110 and v>0.55: value='#dbc28f'
			legs.set_pixel(x,y,nearest(Color(value),palette))
	var full=legs.duplicate()
	full.blend_rect(costume,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
	var parts={'legs':legs,'costume':costume,'head':head,'sit':full}
	for name in parts:
		parts[name].save_png(root+name+'-'+dir+'.png')
	return parts[str(params.get('part','sit'))]
