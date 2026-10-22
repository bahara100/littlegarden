# Coherent new seated body, approved standing head, identical material palette.
var root='C:/nikke-playground/docs/art/pixel/snow-white-sit-v1/'
var standing='C:/nikke-playground/docs/art/pixel/snow-white-idle-v1/'

func ink_inside(body:Image,p:Vector2i,hex:String):
	var c=body.get_pixelv(p)
	# Only shade existing dark boot pixels. Preserve silver knee plates and alpha.
	if c.a>0.9 and max(c.r,max(c.g,c.b))<0.5:
		body.set_pixelv(p,Color(hex))

func detail_boots(body:Image,dir:String):
	# The same charcoal/lavender metal ramps as the approved standing boots.
	if dir=='se':
		for origin in [Vector2i(61,100),Vector2i(73,99)]:
			for y in range(6):
				ink_inside(body,origin+Vector2i(1,y),'#514b60')
				ink_inside(body,origin+Vector2i(2,y),'#433f50')
				ink_inside(body,origin+Vector2i(3,y),'#373342')
			for x in range(1,6):
				ink_inside(body,origin+Vector2i(x,5),'#60596f')
				ink_inside(body,origin+Vector2i(x,6),'#2c2837')
	else:
		for origin in [Vector2i(66,96),Vector2i(78,96)]:
			# Raised heel greave panel, narrow edge light, lower ankle seam.
			for y in range(7):
				ink_inside(body,origin+Vector2i(1,y),'#514b60')
				ink_inside(body,origin+Vector2i(2,y),'#433f50')
				ink_inside(body,origin+Vector2i(4,y),'#2c2837')
			for x in range(1,6):
				ink_inside(body,origin+Vector2i(x,1),'#60596f')
				ink_inside(body,origin+Vector2i(x,7),'#514b60')

func nearest(c:Color,palette:Array,cache:Dictionary)->Color:
	var key=c.to_rgba32()
	if cache.has(key):return cache[key]
	var score=100.0
	var best=palette[0]
	for p in palette:
		var d=pow(c.r-p.r,2)*0.3+pow(c.g-p.g,2)*0.5+pow(c.b-p.b,2)*0.2
		if d<score:
			score=d
			best=p
	cache[key]=best
	return best

func cover_rear_hips(body:Image):
	# Extend the white waist wrap below the rear hip plates, inside the existing silhouette.
	# Bandage at x65..77/y89..93 and all boots stay untouched.
	var rows={86:[55,64],87:[54,65],88:[52,65],89:[52,64],90:[52,64],91:[53,64],92:[54,64],93:[55,64]}
	for y in rows:
		for x in range(rows[y][0],rows[y][1]+1):
			var c=body.get_pixel(x,y)
			if c.a<0.9 or not(c.r>c.g+0.047 and c.r>c.b+0.039):continue
			var shade='#eceef4'
			if x<=rows[y][0]+1:shade='#a9adba'
			elif x<=rows[y][0]+3:shade='#c1c5d0'
			elif y>=91:shade='#d6d9e2'
			if y==93:shade='#60596f'
			body.set_pixel(x,y,Color(shade))
	# Far side of the same wrap sits under the outer hip plate; leave the lower thigh bare.
	for y in range(85,90):
		for x in range(74,80):
			var c=body.get_pixel(x,y)
			if c.a>0.9 and c.r>c.g+0.047 and c.r>c.b+0.039:
				body.set_pixel(x,y,Color('#d6d9e2' if y==89 else '#eceef4'))

func run(api,image:Image,project,params:Dictionary):
	var dir=str(params.get('dir','se'))
	var src=Image.load_from_file(root+'source-ai.png')
	var idle=Image.load_from_file(standing+'idle-'+dir+'.png')
	var palette=[]
	for hex in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):
		palette.append(Color(hex))
	var head=api.create_image(128,128)
	var body=api.create_image(128,128)
	var cache={}
	# Preserve the actual face/goggles/antenna pixels. Keep neck/body continuous below.
	for y in range(68):
		for x in range(128):
			head.set_pixel(x,y,idle.get_pixel(x,y))
	# One transform for all seated anatomy, not independently pasted thighs/shins.
	var region=Rect2i(336,437,427,404) if dir=='se' else Rect2i(988,439,455,394)
	var target=Vector2i(53,46) if dir=='se' else Vector2i(56,43)
	var pos=Vector2i(30,68) if dir=='se' else Vector2i(33,68)
	var fitted=src.get_region(region)
	fitted.resize(target.x,target.y,Image.INTERPOLATE_NEAREST)
	for y in range(target.y):
		for x in range(target.x):
			var c=fitted.get_pixel(x,y)
			if c.a<0.72:continue
			body.set_pixel(pos.x+x,pos.y+y,nearest(c,palette,cache))
	body.save_png(root+'before-boot-detail-'+dir+'.png')
	detail_boots(body,dir)
	if dir=='ne':cover_rear_hips(body)
	var full=body.duplicate()
	full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
	for part in [['head',head],['body',body],['sit',full]]:
		part[1].save_png(root+str(part[0])+'-'+dir+'.png')
	var mirror=full.duplicate()
	mirror.flip_x()
	mirror.save_png(root+'sit-'+('sw' if dir=='se' else 'nw')+'.png')
	var preview=full.duplicate()
	preview.resize(512,512,Image.INTERPOLATE_NEAREST)
	preview.save_png(root+'preview-'+dir+'-4x.png')
	return head if str(params.get('part','body'))=='head' else body
