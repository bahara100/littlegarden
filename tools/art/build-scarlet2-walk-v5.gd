var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v5/'
var previous='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v4/'
var base_root='C:/nikke-playground/docs/art/pixel/'
func is_skin(c:Color)->bool:
	return c.a>0.5 and c.r>c.g+0.078 and c.r>c.b+0.078 and c.r>0.568
func nearest(c:Color,values:Array)->Color:
	var best=Color(values[0]);var score=99.0
	for v in values:
		var p=Color(v)
		var dist=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if dist<score:score=dist;best=p
	return best
func arm_mask(source:Image,arm:int)->Dictionary:
	var seen={};var selected={}
	for y in range(68,94):
		for x in range(43,88):
			var start=Vector2i(x,y)
			if seen.has(start) or not is_skin(source.get_pixel(x,y)):continue
			var queue=[start];var points=[];var k=0;var sx=0.0;var sy=0.0
			seen[start]=true
			while k<queue.size():
				var p=queue[k];k+=1;points.append(p);sx+=p.x;sy+=p.y
				for dy in range(-1,2):
					for dx in range(-1,2):
						var q=p+Vector2i(dx,dy)
						if q.x<43 or q.x>=88 or q.y<68 or q.y>=94 or seen.has(q):continue
						if is_skin(source.get_pixel(q.x,q.y)):seen[q]=true;queue.append(q)
			if points.size()<4:continue
			var cx=sx/points.size();var cy=sy/points.size()
			if cy>=88 or (arm==0 and cx>=62) or (arm==1 and cx<=70):continue
			for p in points:selected[p]=true
	var mask=selected.duplicate()
	# Copy the base's actual opaque outline/cuff neighbours; no rotated samples or new limb shapes.
	for p in selected:
		for dy in range(-2,3):
			for dx in range(-2,3):
				var q=p+Vector2i(dx,dy)
				if q.x<40 or q.x>=92 or q.y<67 or q.y>=96:continue
				var c=source.get_pixel(q.x,q.y)
				if c.a<0.5 or (is_skin(c) and not selected.has(q)):continue
				if abs(dx)<=1 and abs(dy)<=1:
					mask[q]=true
				elif max(c.r,max(c.g,c.b))<0.48:
					mask[q]=true
	return {'mask':mask,'skin':selected}
func make_arm(api,source:Image,arm:int,d:String,n:int)->Dictionary:
	var selected=arm_mask(source,arm)
	var mask=selected.mask
	var raw=api.create_image(128,128)
	var dressed=api.create_image(128,128)
	var anchor=Vector2(58,77) if arm==0 else Vector2(74,77)
	if d=='ne':anchor=Vector2(57,74) if arm==0 else Vector2(73,74)
	var farthest=anchor;var longest=0.0
	for p in selected.skin:
		var distance=Vector2(p).distance_to(anchor)
		if distance>longest:longest=distance;farthest=Vector2(p)
	var vector=farthest-anchor
	var right_arm=(d=='se' and arm==0) or (d=='ne' and arm==1)
	for p in mask:
		var c=source.get_pixel(p.x,p.y)
		raw.set_pixel(p.x,p.y,c)
		var t=clampf((Vector2(p)-anchor).dot(vector)/max(vector.length_squared(),1.0),0.0,1.0)
		var ink:Color
		if is_skin(c):
			ink=nearest(c,['#ba7d69','#da9b80','#eeb499','#f5c9ae','#fde1cf','#ffe9da'])
			if t>=0.38 and t<=0.70:
				ink=Color('#fffdf9' if c.r>0.96 else '#efeaf4' if c.r>0.88 else '#beb5ca' if c.r>0.78 else '#7e758a')
			if not right_arm and t>=0.10 and t<=0.34:
				ink=Color('#a16acd' if c.r>0.92 else '#8250ac' if c.r>0.8 else '#4e2c66')
		elif max(c.r,max(c.g,c.b))<0.48:
			ink=nearest(c,['#210d28','#352438','#463447'])
		else:
			ink=Color('#4c465c' if right_arm else '#663c8c')
		dressed.set_pixel(p.x,p.y,ink)
	var shift=Vector2i(-3,2) if d=='se' else Vector2i(3,5) if arm==0 else Vector2i(0,5)
	var final=api.create_image(128,128)
	final.blit_rect(dressed,Rect2i(0,0,128,128),shift)
	var reference=api.create_image(128,128)
	reference.blit_rect(raw,Rect2i(0,0,128,128),shift)
	raw.save_png(root+'source-arm-'+d+'-'+str(arm)+'-'+str(n+1)+'.png')
	reference.save_png(root+'reference-'+('near' if arm==0 else 'far')+'-'+d+'-'+str(n+1)+'.png')
	return {'art':final,'reference':reference}
func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'))
	var folder='garden-body-walk-se-v20' if d=='se' else 'garden-body-walk-ne-v8'
	var sheets={}
	for kind in ['legs','far','core','near','cap','frame']:sheets[kind]=api.create_image(512,128)
	var first:Image
	for n in range(4):
		var base=api.create_image(128,128)
		base.blit_rect(Image.load_from_file(base_root+folder+'/frame-'+str(n+1)+'.png'),Rect2i(0,0,96,96),Vector2i(16,24))
		base.save_png(root+'base-'+d+'-'+str(n+1)+'.png')
		var core=Image.load_from_file(previous+'core-'+d+'-'+str(n+1)+'.png')
		var legs=Image.load_from_file(previous+'legs-'+d+'-'+str(n+1)+'.png')
		var near=make_arm(api,base,0,d,n).art
		var far=make_arm(api,base,1,d,n).art
		var cap=api.create_image(128,128)
		cap.blit_rect(core,Rect2i(0,0,128,80+(-1 if n%2==1 else 0)),Vector2i.ZERO)
		var full=legs.duplicate()
		for layer in [far,core,near,cap]:full.blend_rect(layer,Rect2i(0,0,128,128),Vector2i.ZERO)
		var pieces={'legs':legs,'far':far,'core':core,'near':near,'cap':cap,'frame':full}
		for kind in pieces:
			pieces[kind].save_png(root+kind+'-'+d+'-'+str(n+1)+'.png')
			sheets[kind].blit_rect(pieces[kind],Rect2i(0,0,128,128),Vector2i(n*128,0))
		if n==0:first=legs
	for kind in sheets:sheets[kind].save_png(root+kind+'-sheet-'+d+'.png')
	return first
