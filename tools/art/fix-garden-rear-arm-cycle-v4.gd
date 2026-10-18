# Whole-frame arm pass. Reuse drawn arms; never rotate limbs at runtime.
var root='C:/nikke-playground/docs/art/pixel/'

func limits(y: int, clothes: bool=false) -> Vector2i:
	if clothes:
		if y==63: return Vector2i(37,62)
		if y==64: return Vector2i(34,64)
		if y>=65: return Vector2i(32,66)
	if y<=52: return Vector2i(41,58)
	if y<=55: return Vector2i(43,57)
	if y==56: return Vector2i(42,58)
	if y<=58: return Vector2i(41,59)
	if y<=60: return Vector2i(40,60)
	if y<=65: return Vector2i(39,60)
	return Vector2i(40,61)

func outside(x: int,y: int,clothes: bool=false) -> bool:
	var edge=limits(y,clothes)
	return x < edge.x or x > edge.y

func arms_from(api,source: Image,clothes: bool=false) -> Image:
	var result=api.create_image(96,96)
	for y in range(49 if clothes else 45,66 if clothes else 68):
		for x in range(96):
			if outside(x,y,clothes): result.set_pixel(x,y,source.get_pixel(x,y))
	return result

func core_from(source: Image,clothes: bool=false) -> Image:
	var result=source.duplicate()
	for y in range(49 if clothes else 45,66 if clothes else 68):
		for x in range(96):
			if outside(x,y,clothes): result.set_pixel(x,y,Color.TRANSPARENT)
	return result

func over(dst: Image,source: Image):
	for y in range(96):
		for x in range(96):
			var c=source.get_pixel(x,y)
			if c.a > 0.5: dst.set_pixel(x,y,c)

func neutral(api,source: Image,n: int,clothes: bool=false) -> Image:
	var result=api.create_image(96,96)
	# Donor is the finished relaxed rear idle; its dress is 6px left of the walk torso.
	for sy in range(52,71):
		for sx in range(96):
			var dx=6 if clothes else 0
			var x=sx+dx
			var y=sy-2
			var side_left=x < 49
			# Passing phases have small opposite forearm offsets; shoulder roots stay put.
			var swing=(1 if n==2 else -1)*(1 if side_left else -1) if y>=58 else 0
			if (side_left and sx>43) or (not side_left and sx<56): continue
			var tx=x+swing
			if tx<0 or tx>=96 or y>= (66 if clothes else 68): continue
			var c=source.get_pixel(sx,sy)
			if c.a>0.5: result.set_pixel(tx,y,c)
	return result

func sleeve(api,arm: Image,who: String) -> Image:
	var result=arm.duplicate()
	for y in range(96):
		for x in range(96):
			var c=arm.get_pixel(x,y)
			if c.a<0.5: continue
			var v=(c.r+c.g+c.b)/3.0
			var ink=v<0.3
			var colour=Color('#352337')
			if not ink:
				if y>=64:
					colour=Color('#ffe1c1' if v>0.77 else '#efb58f')
				elif y>=62:
					colour=Color('#fff0d8' if v>0.7 else '#ddc2a0')
				elif who=='momo':
					colour=Color('#ffd8ba' if v>0.83 else '#efb18d' if v>0.67 else '#d78a6c' if v>0.48 else '#8e4c46')
				else:
					colour=Color('#d4d6aa' if v>0.83 else '#b2bc8b' if v>0.67 else '#8c9b70' if v>0.48 else '#657450')
			result.set_pixel(x,y,colour)
	return result

func run(api,image: Image,project,params: Dictionary):
	var out=root+'garden-body-walk-ne-v4/'
	var old=root+'garden-body-walk-ne-v3/'
	var donor=Image.load_from_file(root+'garden-body-walk-ne-v2/frame-3.png')
	var idle=Image.load_from_file(root+'garden-friends-base-walk-v1/base-idle-ne.png')
	var base_sheet=api.create_image(384,96)
	var base_arms=api.create_image(384,96)
	for n in range(1,5):
		var src=Image.load_from_file(old+'frame-'+str(n)+'.png')
		var core=core_from(src)
		var arm=arms_from(api,src)
		if n==1: arm=arms_from(api,donor)
		if n==2 or n==4: arm=neutral(api,idle,n)
		var result=core.duplicate()
		over(result,arm)
		# Retain the exact existing bald head and unchanged lower body.
		result.blit_rect(src,Rect2i(0,0,96,45),Vector2i.ZERO)
		result.blit_rect(src,Rect2i(0,68,96,28),Vector2i(0,68))
		if n==3: result=src.duplicate()
		result.save_png(out+'frame-'+str(n)+'-native.png')
		arm.save_png(out+'arms-'+str(n)+'.png')
		core.save_png(out+'core-'+str(n)+'.png')
		var flip=result.duplicate()
		flip.flip_x()
		flip.save_png(out+'frame-'+str(n)+'-nw-native.png')
		base_sheet.blit_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		base_arms.blit_rect(arm,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
	base_sheet.save_png(out+'walk.png')
	base_arms.save_png(out+'arms-sheet.png')
	for who in ['momo','lulu']:
		var srcdir=root+'garden-friends-base-walk-v2/'+who+'/'
		var dst=root+'garden-friends-base-walk-v3/'+who+'/'
		DirAccess.make_dir_recursive_absolute(dst)
		var sheet=api.create_image(384,96)
		var mirror=api.create_image(384,96)
		var editor=api.create_image(384,192)
		var layers={}
		for kind in ['legs','costume','head']: layers[kind]=api.create_image(384,192)
		var idle_clothes=Image.load_from_file(srcdir+'idle-ne-costume.png')
		for dir in ['se','ne']:
			for n in range(1,5):
				var garment=Image.load_from_file(srcdir+'costume-'+dir+'-'+str(n)+'.png')
				var leg=Image.load_from_file(srcdir+'legs-'+dir+'-'+str(n)+'.png')
				var head=Image.load_from_file(srcdir+'head-'+dir+'-'+str(n)+'.png')
				if dir=='ne' and n!=3:
					var core=core_from(garment,true)
					var arm=sleeve(api,neutral(api,idle,n),who)
					if n==1:
						arm=api.create_image(96,96)
						var original=arms_from(api,garment,true)
						for y in range(49,66):
							for x in range(96):
								var tx=99-x
								if tx>=59: tx-=2
								var c=original.get_pixel(x,y)
								if c.a>0.5 and tx>=0 and tx<96: arm.set_pixel(tx,y,c)
					garment=core
					over(garment,arm)
					arm.save_png(dst+'arms-'+dir+'-'+str(n)+'.png')
				var full=leg.duplicate()
				over(full,garment)
				over(full,head)
				if dir=='ne':
					# Skirt, knees and feet are the approved previous pixels below the arm work area.
					var previous=Image.load_from_file(srcdir+'full-ne-'+str(n)+'.png')
					full.blit_rect(previous,Rect2i(0,66,96,30),Vector2i(0,66))
					garment.blit_rect(Image.load_from_file(srcdir+'costume-ne-'+str(n)+'.png'),Rect2i(0,66,96,30),Vector2i(0,66))
				for kind in ['legs','costume','head']:
					var part=leg if kind=='legs' else head if kind=='head' else garment
					part.save_png(dst+kind+'-'+dir+'-'+str(n)+'.png')
					layers[kind].blit_rect(part,Rect2i(0,0,96,96),Vector2i((n-1)*96,0 if dir=='se' else 96))
				full.save_png(dst+'full-'+dir+'-'+str(n)+'.png')
				editor.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0 if dir=='se' else 96))
				if dir=='ne':
					sheet.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
					var flip=full.duplicate()
					flip.flip_x()
					mirror.blit_rect(flip,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		for kind in ['legs','costume','head']: layers[kind].save_png(dst+kind+'-editor-sheet.png')
		editor.save_png(dst+'editor-sheet.png')
		sheet.save_png(dst+'walk-ne.png')
		mirror.save_png(dst+'walk-nw.png')
	var proof=base_sheet.duplicate()
	proof.resize(1536,384,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'arm-cycle-proof.png')
	return 'saved rear base V4 and matching friend V3 arm cycles'
