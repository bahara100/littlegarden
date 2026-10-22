var root='C:/nikke-playground/docs/art/pixel/snow-white-walk-v1/'
var idle_root='C:/nikke-playground/docs/art/pixel/snow-white-idle-v1/'
var art='C:/nikke-playground/docs/art/pixel/'

func nearest(c:Color,palette:Array,cache:Dictionary)->Color:
	var k=c.to_rgba32()
	if cache.has(k):return cache[k]
	var score=100.0
	var best=palette[0]
	for p in palette:
		var v=pow(c.r-p.r,2)*0.3+pow(c.g-p.g,2)*0.5+pow(c.b-p.b,2)*0.2
		if v<score:score=v;best=p
	cache[k]=best
	return best

func hair_mask(idle:Image,dir:String)->Dictionary:
	var front_trace={}
	if dir=='se':
		# Trace the approved hair contour; colour filtering dropped dark edge pixels.
		# End before the original standing arm/shoulder badge, not at an arbitrary colour.
		var contour={68:50,69:49,70:48,71:47,72:47,73:47,74:48,75:47,76:47,77:49,78:49,79:49,80:48,81:47,82:47,83:46,84:44,85:44,86:43}
		for y in contour:
			for x in range(28,contour[y]+1):
				if idle.get_pixel(x,y).a>0.9:front_trace[Vector2i(x,y)]=true
		# The user meant the cheek-side lock ending at the shoulder, not the outer back-hair tips.
		# Preserve its continuous pale strand and dark tip from the approved standing drawing.
		var side_lock={68:[51,59],69:[51,59],70:[54,60],71:[55,60],72:[56,60]}
		for y in side_lock:
			for x in range(side_lock[y][0],side_lock[y][1]+1):
				if idle.get_pixel(x,y).a>0.9:front_trace[Vector2i(x,y)]=true
		# User's red box is on SCREEN RIGHT below the cheek. Previous left-lock fixes missed it.
		# This lock was omitted completely by the left-only head/body split at row68.
		var right_lock={68:[72,83],69:[71,83],70:[73,83],71:[74,83],72:[75,83],73:[76,82],74:[76,80],75:[77,80],76:[78,79]}
		for y in right_lock:
			for x in range(right_lock[y][0],right_lock[y][1]+1):
				if idle.get_pixel(x,y).a>0.9:front_trace[Vector2i(x,y)]=true
	var mask={}
	for y in range(68,89):
		var limit=50 if dir=='se' else 68
		if dir=='se' and y>=72:limit=46
		if dir=='se' and y>=83:limit=43
		if dir=='ne' and y>=78:limit=65
		if dir=='ne' and y>=83:limit=61
		if dir=='ne' and y>=86:limit=56
		for x in range(28,limit+1):
			var c=idle.get_pixel(x,y)
			if c.a>0.9 and ((c.b>c.r+0.025 and c.r>0.30) or min(c.r,min(c.g,c.b))>0.65):mask[Vector2i(x,y)]=true
	var result=mask.duplicate()
	for p in mask:
		for dy in range(-1,2):
			for dx in range(-1,2):
				var q=p+Vector2i(dx,dy)
				if q.y>=68 and q.y<89 and q.x>=28 and q.x<70 and idle.get_pixelv(q).a>0.9:
					var c=idle.get_pixelv(q)
					if max(c.r,max(c.g,c.b))<0.40:result[q]=true
	result.merge(front_trace)
	return result

func repair_bandage(body:Image,d:String,n:int):
	# Anatomical right thigh remains the bandaged leg even when the legs cross.
	# SE2 right thigh is behind the supporting left leg; do not paint bandage on the front leg.
	if d=='se' and n==1:
		for y in range(90,96):
			for x in range(57,69):
				var c=body.get_pixel(x,y)
				if c.a>0.9 and min(c.r,min(c.g,c.b))>0.47 and not(c.r>c.g+0.047 and c.r>c.b+0.039):
					body.set_pixel(x,y,Color('#f8ccb8' if x<61 else '#ffddcb'))
	# NE4 generated an additional false band on the bare left supporting thigh.
	if d=='ne' and n==3:
		for y in range(90,94):
			for x in range(67,74):
				var c=body.get_pixel(x,y)
				if c.a>0.9 and min(c.r,min(c.g,c.b))>0.47 and not(c.r>c.g+0.047 and c.r>c.b+0.039):
					body.set_pixel(x,y,Color('#f8ccb8' if x<70 else '#ffddcb'))

func repair_rear_arm(body:Image,n:int):
	if n<2:return
	# Reuse the actual detailed flexed gauntlet pixels, not a new mitten stamp or rotation.
	var source=Image.load_from_file(root+'body-se-3.png')
	var bob=-1 if n==3 else 0
	for y in range(73+bob,88+bob):
		for x in range(75,93):
			if y>=83+bob and x<80:continue
			var c=body.get_pixel(x,y)
			if x<=79 and min(c.r,min(c.g,c.b))>0.60:continue
			body.set_pixel(x,y,Color(0,0,0,0))
	var rows={74:[51,59],75:[51,59],76:[49,59],77:[48,58],78:[48,57],79:[48,56],80:[48,56],81:[48,55],82:[48,54],83:[49,54],84:[50,54]}
	var dy=-2 if n==2 else -1
	for y in rows:
		for x in range(rows[y][0],rows[y][1]+1):
			var c=source.get_pixel(x,y)
			if c.a>0.9:body.set_pixel(132-x,y+dy,c)
	if n==2:
		# Frame3: tuck the flexed elbow/gauntlet 2px inward and 2px down.
		# Preserve the shoulder root and the actual detailed gauntlet pixels.
		var prior=body.duplicate()
		for y in rows:
			for x in range(rows[y][0],rows[y][1]+1):body.set_pixel(132-x,y-2,Color(0,0,0,0))
		for y in rows:
			for x in range(rows[y][0],rows[y][1]+1):
				var c=source.get_pixel(x,y)
				if c.a>0.9:body.set_pixel(130-x,y,c)
		for y in range(72,74):
			for x in range(73,82):body.set_pixel(x,y,prior.get_pixel(x,y))
		# R7: the old root's outer tip protruded above the lowered arm.
		# Trim just these ten pixels; retain its inner shoulder attachment.
		for y in range(72,74):
			for x in range(77,82):body.set_pixel(x,y,Color(0,0,0,0))

func stabilize_front_neck(body:Image,idle:Image,bob:int):
	# The independent generated necks drift under the approved common head.
	# Reuse one connected standing collar/chest core; exclude both swinging arms.
	for y in range(68,81):
		for x in range(60,76):
			body.set_pixel(x,y+bob,idle.get_pixel(x,y))

func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'))
	var src=Image.load_from_file(root+'source-dress-'+d+'.png')
	var idle=Image.load_from_file(idle_root+'idle-'+d+'.png')
	var palette=[]
	for hex in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):palette.append(Color(hex))
	var anchors=[[341,333],[969,333],[332,963],[968,959]] if d=='se' else [[335,315],[941,308],[344,926],[950,924]]
	var parts={}
	for name in ['head','body','frame']:parts[name]=api.create_image(512,128)
	if d=='se':parts['front-arm']=api.create_image(512,128)
	var base_sheet=api.create_image(512,128)
	var mask=hair_mask(idle,d)
	var cache={}
	for n in range(4):
		var bob=-1 if n%2==1 else 0
		var head=api.create_image(128,128)
		for y in range(89):
			for x in range(128):
				if y+bob>=0 and (y<68 or mask.has(Vector2i(x,y))):
					head.set_pixel(x,y+bob,idle.get_pixel(x,y))
		var body=api.create_image(128,128)
		var anchor=Vector2i(anchors[n][0],anchors[n][1])
		var scaley=6.0 if d=='se' else 7.0
		for y in range(68,124):
			var sy=anchor.y-20+int(floor((y-68+0.5)*scaley))
			if sy<0 or sy>=src.get_height():continue
			if n<2 and sy>=627:continue
			for x in range(28,95):
				var sx=anchor.x+int(floor((x-(65 if d=='se' else 66)+0.5)*6.4))
				if sx<0 or sx>=src.get_width():continue
				var c=src.get_pixel(sx,sy)
				if c.a<0.72:continue
				body.set_pixel(x,y+bob,nearest(c,palette,cache))
		body.save_png(root+'before-pose-fixes-'+d+'-'+str(n+1)+'.png')
		repair_bandage(body,d,n)
		if d=='se':stabilize_front_neck(body,idle,bob)
		if d=='ne':repair_rear_arm(body,n)
		var full=body.duplicate()
		full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
		var values={'head':head,'body':body,'frame':full}
		if d=='se':
			# The flexed close hand in3 stays in front of the restored inner hair strand.
			var front_arm=api.create_image(128,128)
			if n==2:
				for y in range(77,81):
					for x in range(48,50):
						if head.get_pixel(x,y).a>0.9 and body.get_pixel(x,y).a>0.9:
							front_arm.set_pixel(x,y,body.get_pixel(x,y))
			full.blend_rect(front_arm,Rect2i(0,0,128,128),Vector2i.ZERO)
			values['front-arm']=front_arm
		for kind in values:
			values[kind].save_png(root+kind+'-'+d+'-'+str(n+1)+'.png')
			parts[kind].blit_rect(values[kind],Rect2i(0,0,128,128),Vector2i(n*128,0))
		var mirrored=full.duplicate()
		mirrored.flip_x()
		mirrored.save_png(root+'frame-'+('sw' if d=='se' else 'nw')+'-'+str(n+1)+'.png')
		var folder='garden-body-walk-se-v20/' if d=='se' else 'garden-body-walk-ne-v8/'
		var base=api.create_image(128,128)
		base.blit_rect(Image.load_from_file(art+folder+'frame-'+str(n+1)+'.png'),Rect2i(0,0,96,96),Vector2i(16,19))
		base.save_png(root+'base-'+d+'-'+str(n+1)+'.png')
		base_sheet.blit_rect(base,Rect2i(0,0,128,128),Vector2i(n*128,0))
	for kind in parts:parts[kind].save_png(root+kind+'-sheet-'+d+'.png')
	base_sheet.save_png(root+'base-sheet-'+d+'.png')
	var proof=api.create_image(256,256)
	for n in range(4):proof.blit_rect(parts.frame,Rect2i(n*128,0,128,128),Vector2i(n%2*128,n/2*128))
	proof.resize(768,768,Image.INTERPOLATE_NEAREST)
	proof.save_png(root+'contact-'+d+'-3x.png')
	return {'frames':4,'direction':d,'headPixels':'approved standing, integer bob only'}
