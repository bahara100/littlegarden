var root='C:/nikke-playground/docs/art/pixel/'

func body_edge(y:int)->Vector2i:
	if y<=52: return Vector2i(41,58)
	if y<=55: return Vector2i(43,57)
	if y==56: return Vector2i(42,58)
	if y<=58: return Vector2i(41,59)
	if y<=60: return Vector2i(40,60)
	return Vector2i(39,60)

func dress_edge(y:int)->Vector2i:
	if y<=58: return Vector2i(42,58)
	if y==59: return Vector2i(41,59)
	if y==60: return Vector2i(40,60)
	if y==61: return Vector2i(38,61)
	if y==62: return Vector2i(36,63)
	if y==63: return Vector2i(34,65)
	if y==64: return Vector2i(32,67)
	return Vector2i(30,69)

func garment_colour(c:Color,y:int,bottom:int,who:String)->Color:
	var v=(c.r+c.g+c.b)/3.0
	if v<0.3: return Color('#352337')
	if y>=bottom-3:
		return Color('#ffe1c1' if c.g>0.83 else '#f5c3a2' if c.g>0.72 else '#da9877')
	if y==bottom-4:
		return Color('#fff0d8' if v>0.72 else '#ddc2a0')
	if who=='momo':
		return Color('#ffd8ba' if v>0.81 else '#efb18d' if v>0.68 else '#d78a6c' if v>0.48 else '#8e4c46')
	return Color('#d4d6aa' if v>0.81 else '#b2bc8b' if v>0.68 else '#8c9b70' if v>0.48 else '#657450')

func is_skin(c:Color)->bool:
	return c.a>0.5 and c.r>c.g+0.07 and c.r>c.b+0.04 and c.r>0.6

func skin_arm(base:Image,left:bool)->Dictionary:
	var found={}
	var queue=[]
	for y in range(49,64):
		for x in range(25 if left else 61,39 if left else 74):
			if is_skin(base.get_pixel(x,y)):
				var p=Vector2i(x,y)
				if not found.has(p):
					found[p]=true
					queue.append(p)
	var cursor=0
	while cursor<queue.size():
		var p=queue[cursor]
		cursor+=1
		for dy in range(-1,2):
			for dx in range(-1,2):
				var q=p+Vector2i(dx,dy)
				if q.y<49 or q.y>65 or q.x<25 or q.x>74: continue
				if found.has(q): continue
				if is_skin(base.get_pixelv(q)):
					found[q]=true
					queue.append(q)
	return found

func run(api,image:Image,project,params:Dictionary):
	var out=root+'garden-friends-base-walk-v5/'
	DirAccess.make_dir_recursive_absolute(out)
	var proof=api.create_image(384,288)
	proof.fill(Color('#d5dce1'))
	proof.blend_rect(Image.load_from_file(root+'garden-body-walk-ne-v8/walk.png'),Rect2i(0,0,384,96),Vector2i.ZERO)
	for who in ['momo','lulu']:
		var dst=out+who+'/'
		DirAccess.make_dir_recursive_absolute(dst)
		var old=root+'garden-friends-base-walk-v2/'+who+'/'
		var sheet=api.create_image(384,96)
		var mirror=api.create_image(384,96)
		var editor=api.create_image(384,192)
		var layers={}
		for kind in ['legs','costume','head']: layers[kind]=api.create_image(384,192)
		for dir in ['se','ne']:
			for n in range(1,5):
				var costume=Image.load_from_file(old+'costume-'+dir+'-'+str(n)+'.png')
				var head=Image.load_from_file(old+'head-'+dir+'-'+str(n)+'.png')
				var leg=Image.load_from_file(old+'legs-'+dir+'-'+str(n)+'.png')
				if dir=='ne':
					var base=Image.load_from_file(root+'garden-body-walk-ne-v8/frame-'+str(n)+'.png')
					var arms=api.create_image(96,96)
					var bottoms=[45,45]
					for side in range(2):
						var skin=skin_arm(base,side==0)
						for p in skin:
							arms.set_pixelv(p,base.get_pixelv(p))
							bottoms[side]=maxi(bottoms[side],p.y)
							for dy in range(-2,3):
								for dx in range(-2,3):
									var q=p+Vector2i(dx,dy)
									if q.x<25 or q.x>74 or q.y<49 or q.y>65: continue
									var c=base.get_pixelv(q)
									if c.a>0.5 and (c.r+c.g+c.b)/3.0<0.3: arms.set_pixelv(q,c)
					# Shirt shoulder roots become short matching sleeves under the hair.
					for y in range(49,54):
						var edge=body_edge(y)
						for x in range(25,74):
							if x>=edge.x and x<=edge.y: continue
							var c=base.get_pixel(x,y)
							if c.a>0.5: arms.set_pixel(x,y,c)
					# Remove the former sleeve/hand area, protecting the flared skirt.
					for y in range(49,66):
						var edge=dress_edge(y)
						for x in range(25,74):
							if x<edge.x or x>edge.y: costume.set_pixel(x,y,Color.TRANSPARENT)
					var dressed_arms=api.create_image(96,96)
					for y in range(49,66):
						for x in range(25,74):
							var c=arms.get_pixel(x,y)
							if c.a<0.5: continue
							var side=0 if x<49 else 1
							var pivot=36 if side==0 else 64
							var tx=x-1 if x<pivot else x+1 if x>pivot else x
							var colour=garment_colour(c,y,bottoms[side],who)
							# Add two columns through the interior, retaining contour/hand shading.
							dressed_arms.set_pixel(tx,y+3,colour)
							if x==pivot:
								dressed_arms.set_pixel(tx-1,y+3,colour)
								dressed_arms.set_pixel(tx+1,y+3,colour)
					costume.blend_rect(dressed_arms,Rect2i(0,0,96,96),Vector2i.ZERO)
					dressed_arms.save_png(dst+'arms-ne-'+str(n)+'.png')
				var full=leg.duplicate()
				full.blend_rect(costume,Rect2i(0,0,96,96),Vector2i.ZERO)
				full.blend_rect(head,Rect2i(0,0,96,96),Vector2i.ZERO)
				if who=='momo' and (n==1 or n==3):
					# Complete the rounded bottom edge of the extended front shoe.
					var bottom=88 if dir=='se' and n==1 else 89 if dir=='se' else 90
					var left=56 if dir=='se' and n==1 else 50 if dir=='se' else 35 if n==1 else 38
					var right=64 if dir=='se' and n==1 else 59 if dir=='se' else 43 if n==1 else 46
					for x in range(left,right+1):
						full.set_pixel(x,bottom,Color('#352337'))
						leg.set_pixel(x,bottom,Color('#352337'))
				full.save_png(dst+'full-'+dir+'-'+str(n)+'.png')
				for kind in ['legs','costume','head']:
					var part=leg if kind=='legs' else head if kind=='head' else costume
					part.save_png(dst+kind+'-'+dir+'-'+str(n)+'.png')
					layers[kind].blit_rect(part,Rect2i(0,0,96,96),Vector2i((n-1)*96,0 if dir=='se' else 96))
				editor.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0 if dir=='se' else 96))
				if dir=='ne':
					sheet.blit_rect(full,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
					var flip=full.duplicate()
					flip.flip_x()
					mirror.blit_rect(flip,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		for kind in layers: layers[kind].save_png(dst+kind+'-editor-sheet.png')
		editor.save_png(dst+'editor-sheet.png')
		sheet.save_png(dst+'walk-ne.png')
		mirror.save_png(dst+'walk-nw.png')
		proof.blend_rect(sheet,Rect2i(0,0,384,96),Vector2i(0,96 if who=='momo' else 192))
	proof.resize(1536,1152,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'friends-arms-soles-review.png')
	return 'V5: dressed arms lower by 3px and wider by 2px; Momo 1/3 soles completed'
