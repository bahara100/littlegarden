var root='C:/nikke-playground/docs/art/pixel/'

func nearest(c:Color, palette:Array)->Color:
	var best=palette[0]
	var score=99.0
	for p in palette:
		var d=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d<score:
			score=d
			best=p
	return best

func run(api,image:Image,project,params:Dictionary):
	var who=str(params.get('who','momo'))
	var out=root+'garden-friends-sit-rear-v2/'+who+'/'
	var source=Image.load_from_file(root+'garden-friends-sit-rear-v2/source-tailored-ai.png')
	var base=Image.load_from_file(root+'garden-body-sit-ne-v1/sit-ne.png')
	var old=root+'garden-friends-base-walk-v2/'+who+'/'
	var palette=[]
	for value in JSON.parse_string(FileAccess.get_file_as_string(out+'palette.json')):
		palette.append(Color(value))
	var costume=api.create_image(96,96)
	var cell=0 if who=='momo' else 1
	var center=509.0 if who=='momo' else 396.0
	var scale=48.0/452.0
	for y in range(52,77):
		for x in range(20,78):
			var sx=int(floor((x-48.0+0.5)/scale+center))+cell*887
			var sy=int(floor((y-5.0+0.5)/scale+57.0))
			var c=source.get_pixel(sx,sy)
			if c.a<0.7: continue
			# The forward knee and hanging shins must come from the common seated base, not a new pose.
			if y>=67 and x>=61: continue
			if y>=75 and x>=54: continue
			costume.set_pixel(x,y,nearest(c,palette))
	var legs=api.create_image(96,96)
	for y in range(66,96):
		for x in range(96):
			var c=base.get_pixel(x,y)
			if c.a<0.5: continue
			var skin=c.r>c.g+0.07 and c.r>c.b+0.04 and c.r>0.6
			var v=(c.r+c.g+c.b)/3.0
			var value=''
			if skin:
				value=('#ffe1c1' if v>0.8 else '#efb58f') if y<77 else ('#fff0d8' if v>0.8 else '#ddc2a0')
			elif v<0.3: value='#352337'
			elif y>=77: value='#6e4740' if v<0.48 else '#9b6b46' if v<0.64 else '#b88a5b' if v<0.76 else '#ddba87'
			if value!='': legs.set_pixel(x,y,Color(value))
	var head=api.create_image(96,96)
	# This new torso's nape is four pixels right of the neutral standing torso. Move existing head intact.
	head.blit_rect(Image.load_from_file(old+'idle-ne-head.png'),Rect2i(0,0,96,96),Vector2i(4,0))
	var full=legs.duplicate()
	full.blend_rect(costume,Rect2i(0,0,96,96),Vector2i.ZERO)
	var body=full.duplicate()
	full.blend_rect(head,Rect2i(0,0,96,96),Vector2i.ZERO)
	for name in ['full','head','costume','legs','body']:
		var part=full if name=='full' else head if name=='head' else costume if name=='costume' else body if name=='body' else legs
		part.save_png(out+name+'-ne.png')
		var mirror=part.duplicate()
		mirror.flip_x()
		mirror.save_png(out+name+'-nw.png')
	var part=str(params.get('part','full'))
	return head if part=='head' else costume if part=='costume' else legs if part=='legs' else full
